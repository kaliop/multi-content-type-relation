import { getPluginConfiguration, log } from '../utils';
import type { Context, StrapiResponse, AnyEntity } from '../interface';
import { flattenObj, unflatten } from '../helpers';
import type { UID } from '@strapi/strapi';

export default async (ctx, next) => {
  await next();

  if (!ctx.body) return;
  if (!ctx.body.data) return;

  if (
    [
      'collection-types.create',
      'collection-types.update',
      'single-types.createOrUpdate'
    ].includes(ctx?.state?.route?.handler)
  ) {
    const [, _, __, rest] = ctx?.request.url.split('/');
    const contentType = rest.split('?')[0];

    const isDraftAndPublish =
      strapi.contentTypes[contentType].options?.draftAndPublish;

    // We want to update relation only on publish for those who have it activated
    if (isDraftAndPublish) {
      log(`[MIDDLEWARE] ${contentType}is draft and publish`);
      return;
    }

    const documentId = ctx.body.data.documentId;
    syncMctrRelation(documentId, contentType as UID.ContentType);
  }

  if (
    ['collection-types.publish', 'single-types.publish'].includes(
      ctx?.state?.route?.handler
    )
  ) {
    const [, _, __, rest] = ctx?.request.url.split('/');
    const contentType = rest.split('?')[0];

    const documentId = ctx.body.data.documentId;
    syncMctrRelation(documentId, contentType as UID.ContentType);
  }

  // Only on specific handlerswith public API we want to hydrate the MCTR relation
  if (!ctx?.request?.url?.startsWith('/api')) return;
  if (ctx.request.method !== 'GET') return;
  if (!ctx.body) return;

  const configuration = getPluginConfiguration();

  const handler = ctx.state.route.handler;
  const contentTypes = Object.keys(strapi.contentTypes);

  log(`[MIDDLEWARE] URL: ${ctx.request.url} (${ctx.request.method})`);
  log(`[MIDDLEWARE] Strapi Route: ${JSON.stringify(ctx.state.route, null, 2)}`);

  if (typeof handler !== 'string') return;

  const validHandler = contentTypes
    .filter((contentType) => contentType.startsWith('api::'))
    .some(
      (contentType) =>
        handler.includes(`${contentType}.findOne`) ||
        handler.includes(`${contentType}.findMany`) ||
        handler.includes(`${contentType}.find`)
    );

  log(`[MIDDLEWARE] Is valid handler: ${validHandler}`);

  // Allow only findOne/findMany for native contentypes that have api::
  if (!validHandler) return;

  const context = {
    configuration,
    publicationState: ctx.request.query?.['publicationState'] ?? 'live'
  };

  log(`[MIDDLEWARE] Context Body: ${JSON.stringify(ctx.body, null, 2)}`);
  if (ctx.body.error || !ctx.body?.data) return;

  const hydratedData = await augmentMRCT(ctx.body, 1, context);

  ctx.body.data = hydratedData;
};

const augmentMRCT = async (
  strapiResponse: StrapiResponse,
  currentDepth: number,
  context: Context
): Promise<AnyEntity | AnyEntity[]> => {
  if (Array.isArray(strapiResponse.data)) {
    const promises = strapiResponse.data.map((item) =>
      hydrateMRCT(item, currentDepth, context)
    );

    return await Promise.all(promises);
  } else {
    return await hydrateMRCT(strapiResponse.data, currentDepth, context);
  }
};

const hydrateMRCT = async (
  content: AnyEntity,
  currentDepth: number,
  context: Context
) => {
  const eligibleProperties: Set<string> = new Set();
  const contentsToFetch: Set<string> = new Set();

  const { configuration } = context;

  const flattenedProperties = flattenObj(content, null);

  for (const [key, value] of Object.entries(flattenedProperties)) {
    if (typeof value !== 'string' || !value.includes('MRCT')) continue;

    try {
      const field = JSON.parse(value);

      if (!Array.isArray(field)) continue;

      for (const item of field) {
        if (
          Object.keys(item).length !== 3 ||
          (!item.uid && typeof item.uid !== 'string') ||
          !item.documentId
        )
          continue;

        const compositeID = `${item.uid}####${item.documentId}`;

        eligibleProperties.add(key);

        if (contentsToFetch.has(compositeID)) continue;
        else contentsToFetch.add(compositeID);
      }
    } catch (e) {
      continue;
    }
  }

  if (!contentsToFetch.size) return content;

  log(
    `[MCTR HYDRATOR] Depth: ${currentDepth}, Hydrating MCTR for ID ${content.id}`
  );

  const promises: Promise<any>[] = [];
  for (const item of Array.from(contentsToFetch)) {
    const [uid, documentId] = item.split('####');
    const promise = strapi
      .documents(uid as any)
      .findOne({ documentId, populate: '*', status: 'published' })
      .then(async (response) => {
        if (!response) return { uid, response };

        if (
          configuration.recursive.enabled &&
          currentDepth < configuration.recursive.maxDepth
        ) {
          // Entity service serve the content flattened, so we need to rebuild the API format for the hydrate recursion
          const hydratedResponse = await hydrateMRCT(
            response as unknown as AnyEntity, //TODO: fix me
            currentDepth + 1,
            context
          );

          return {
            uid,
            response: {
              documentId: response.documentId,
              ...hydratedResponse
            }
          };
        } else {
          return {
            uid,
            response: {
              documentId: response.documentId,
              ...response
            }
          };
        }
      });

    promises.push(promise);
  }

  const linkedEntries: any[] = await Promise.all(promises);

  const filteredLinkedEntries: { uid: string; response: AnyEntity }[] =
    linkedEntries
      .filter((linkedEntry) => Boolean(linkedEntry.response))
      .filter((linkedEntry) => {
        const contentTypeConfiguration = strapi.contentTypes[linkedEntry.uid];

        if (!contentTypeConfiguration) return true;
        if (!contentTypeConfiguration.options?.draftAndPublish) return true;
        if (context.publicationState === 'preview') return true;

        return typeof linkedEntry.response?.publishedAt === 'string';
      });

  for (const key of Array.from(eligibleProperties)) {
    const hydratedArray: AnyEntity[] = [];

    const unhydratedField = JSON.parse(flattenedProperties[key]) as {
      uid: string;
      documentId: string;
    }[];

    for (const item of unhydratedField) {
      const matchingContent = filteredLinkedEntries.find(
        (linkedEntry) =>
          item.uid === linkedEntry.uid &&
          item.documentId === linkedEntry.response.documentId
      );

      if (matchingContent) {
        hydratedArray.push(matchingContent.response);
      }
    }

    flattenedProperties[key] = hydratedArray;
  }

  const newContent = unflatten(flattenedProperties);
  return {
    ...content,
    ...newContent
  };
};

const syncMctrRelation = async (documentId: string, uid: UID.ContentType) => {
  const mctrDocuments = await strapi
    .documents('plugin::multi-content-type-relation.mctr-relation')
    .findMany({
      filters: {
        sourceDocId: documentId
      }
    });

  if (mctrDocuments.length !== 0) {
    log(`[SYNC] Delete MCTR relations for ${documentId}`);
    // delete the mctr relation
    await Promise.all(
      mctrDocuments.map(async ({ documentId }) => {
        await strapi
          .documents('plugin::multi-content-type-relation.mctr-relation')
          .delete({
            documentId
          });
      })
    );
  }

  log(`[SYNC] Find document ${documentId}`);
  const document = await strapi.documents(uid).findOne({
    documentId
  });

  // Explore document to find the mctr relation
  const contentTypeKey = Object.keys(strapi.contentTypes).find(
    (ct) => strapi.contentTypes[ct].uid === uid
  );

  if (!contentTypeKey) return;

  const contentType = strapi.contentTypes[contentTypeKey];

  // TODO: recursive find the mctr relation
  const mctrFields = Object.keys(contentType.attributes).filter(
    (field) =>
      contentType.attributes[field].customField ===
      'plugin::multi-content-type-relation.multi-content-type-relation'
  );

  if (mctrFields.length === 0) return;

  const targetJSON = [];

  // Create the mctr relation to have a sync
  mctrFields.forEach(async (field) => {
    const fieldValue = document[field];
    if (!fieldValue) return;

    try {
      const mctrField = JSON.parse(fieldValue);
      mctrField.forEach((item) => {
        targetJSON.push(`${field}##${item.uid}##${item.documentId}`);
      });
    } catch (e) {
      log(`[SYNC] Error parsing field ${field} ${fieldValue}`);
    }
  });

  log(`[SYNC] Target JSON ${targetJSON}`);
  if (targetJSON.length === 0) return;

  await strapi
    .documents('plugin::multi-content-type-relation.mctr-relation')
    .create({
      data: {
        sourceUID: uid,
        sourceDocId: documentId,
        target: targetJSON
      }
    });

  log(`[SYNC] MCTR relation created for ${documentId}`);
};
