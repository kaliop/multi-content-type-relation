import { getPluginConfiguration, log } from '../utils';
import type { Context, StrapiResponse, AnyEntity } from '../interface';
import {
  collectMctrValues,
  flattenObj,
  getComponentsPopulate,
  getFullPopulateObject,
  getPathsPopulateObject,
  unflatten
} from '../helpers';
import type { UID } from '@strapi/strapi';

export default async (ctx, next) => {
  await next();

  if (!ctx.body) return;
  if (!ctx.body.data) return;

  let hasSyncedRelations = false

  if (
    [
      'collection-types.create',
      'collection-types.update',
      'single-types.createOrUpdate'
    ].includes(ctx?.state?.route?.handler) && !hasSyncedRelations
  ) {
    const [, _, __, rest] = ctx?.request.url.split('/');
    const contentType = rest.split('?')[0];

    const isDraftAndPublish =
      strapi.contentTypes[contentType].options?.draftAndPublish;

    // We want to update relation only on publish for those who have it activated
    if (isDraftAndPublish) {
      log(`[MIDDLEWARE] ${contentType} is draft and publish`);
      return;
    }

    const documentId = ctx.body.data.documentId;
    const locale = ctx.body.data.locale
    log(`[MIDDLEWARE] ${ctx?.state?.route?.handler} Syncing MCTR relation for ${contentType}, documentId: ${documentId}`);
    syncMctrRelation(documentId, contentType as UID.ContentType, locale);
    hasSyncedRelations = true;
  }

  if (
    ['collection-types.publish', 'single-types.publish'].includes(
      ctx?.state?.route?.handler
    ) && !hasSyncedRelations
  ) {
    const [, _, __, rest] = ctx?.request.url.split('/');
    const contentType = rest.split('?')[0];

    const documentId = ctx.body.data.documentId;
    const locale = ctx.body.data.locale
    syncMctrRelation(documentId, contentType as UID.ContentType, locale);
    log(`[MIDDLEWARE] ${ctx?.state?.route?.handler} Syncing MCTR relation for ${contentType}, documentId: ${documentId}`);
    hasSyncedRelations = true;
  }

  // Only on specific handlerswith public API we want to hydrate the MCTR relation
  if (!ctx?.request?.url?.startsWith('/api')) return;
  if (ctx.request.method !== 'GET') return;
  if (!ctx.body) return;

  const configuration = getPluginConfiguration();

  const handler = ctx.state.route.handler;
  const contentTypes = Object.keys(strapi.contentTypes);

  log(`[MIDDLEWARE] URL: ${ctx.request.url} (${ctx.request.method})`);
  log(`[MIDDLEWARE] Strapi Route: ${ctx.state.route}`);

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

  const skipDeep = ctx.request.query?.mctrSkipDeep === 'true';

  const context = {
    configuration,
    publicationState: ctx.request.query?.['publicationState'] ?? 'live',
    skipDeep,
    populatePaths: skipDeep ? parsePopulatePaths(ctx.request.query?.mctrPopulate) : []
  };

  if (ctx.body.error || !ctx.body?.data) return;

  const hydratedData = await augmentMRCT(ctx.body, 1, context);

  ctx.body.data = hydratedData;
};

const parsePopulatePaths = (value: unknown): string[] =>
  [value]
    .flat()
    .filter((path): path is string => typeof path === 'string')
    .flatMap((path) => path.split(','))
    .map((path) => path.trim())
    .filter(Boolean);

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
          (!item.uid && typeof item.uid !== 'string') ||
          !item.documentId
        )
          continue;

        const compositeID = `${item.uid}####${item.documentId}${item.locale ? `####${item.locale}` : ''}`;

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
    const [uid, documentId, locale] = item.split('####');
    const options = { documentId, status: 'published' } as any;
    if (locale) {
      options.locale = locale;
    }

    let promise: Promise<any> = null;
    // Check MCTR fields that contains UID that no longer exists
    if (!strapi.contentTypes[uid]) {
      promise = Promise.resolve({ uid, response: null });
    } else {
      if (!context.skipDeep) {
        options.populate = configuration.useDeepSystem
          ? (getFullPopulateObject(uid, 5, []) as any).populate
          : '*';
      } else if (context.populatePaths.length) {
        const populate = getPathsPopulateObject(uid, context.populatePaths);
        if (populate) options.populate = populate;
      }

      const findOne = (): Promise<any> => strapi.documents(uid as any).findOne(options);

      promise = (context.skipDeep
        ? (strapi.requestContext.run(undefined, findOne as any) as Promise<any>)
        : findOne())
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
      locale?: string;
    }[];

    for (const item of unhydratedField) {
      let matchingContent = null;
      if (item.locale) {
        matchingContent = filteredLinkedEntries.find(
          (linkedEntry) =>
            item.uid === linkedEntry.uid &&
            item.documentId === linkedEntry.response.documentId &&
            item.locale === linkedEntry.response.locale
        );
      } else {
        matchingContent = filteredLinkedEntries.find(
          (linkedEntry) =>
            item.uid === linkedEntry.uid &&
            item.documentId === linkedEntry.response.documentId
        );
      }

      if (matchingContent) {
        hydratedArray.push({ uid: matchingContent.uid, ...matchingContent.response });
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

const syncMctrRelation = async (documentId: string, uid: UID.ContentType, locale?: string) => {
  const configuration = getPluginConfiguration();
  if (configuration.disableRevertRelations) {
    log(`[SYNC] Revert relations are disabled, discarding sync`);
    return
  }

  log(`[SYNC] Syncing MCTR relation for ${documentId}, uid: ${uid}, locale: ${locale}`);
  
  // Explore document to find the mctr relation
  const contentTypeKey = Object.keys(strapi.contentTypes).find(
    (ct) => strapi.contentTypes[ct].uid === uid
  );

  if (!contentTypeKey) return;

  const contentType = strapi.contentTypes[contentTypeKey];

  let mctrRelationDocumentId = documentId;
  if (locale) {
    mctrRelationDocumentId = `${documentId}####${locale}`;
  }
  
  try {
    // Find the mctr relation document
    const mctrDocuments = await strapi
    .documents('plugin::multi-content-type-relation.mctr-relation')
    .findMany({
      filters: {
        sourceDocId: mctrRelationDocumentId
      }
    });

    log(`[SYNC] MCTR relations for ${mctrRelationDocumentId}: ${JSON.stringify(mctrDocuments, null, 2)}`);

    // Delete MCTR relations for the document
    if (mctrDocuments.length !== 0) {
      log(`[SYNC] Delete MCTR relations for ${mctrRelationDocumentId}`);
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
    const options = {
      documentId,
      populate: getComponentsPopulate(contentType.attributes)
    } as any;
    if (locale) {
      options.locale = locale
    }
    const document = await strapi.documents(uid).findOne(options);

    const targetJSON = [];

    collectMctrValues(contentType.attributes, document).forEach(([field, fieldValue]) => {
      try {
        JSON.parse(fieldValue).forEach((item) => {
          targetJSON.push(`${field}##${item.uid}##${item.documentId}${locale ? `####${locale}` : ''}`);
        });
      } catch (e) {
        log(`[SYNC] Error parsing field ${field} ${fieldValue}`);
      }
    });

    log(`[SYNC] Target JSON for ${documentId}: ${JSON.stringify(targetJSON, null, 2)}`);
    if (targetJSON.length === 0) return;

    await strapi
      .documents('plugin::multi-content-type-relation.mctr-relation')
      .create({
        data: {
          sourceUID: uid,
          sourceDocId: mctrRelationDocumentId,
          target: targetJSON
        }
      });

    log(`[SYNC] MCTR relation created for ${documentId}`);
  } catch (error) {
    log(`[SYNC] Error creating MCTR relation for ${documentId}: ${error}`);
    return
  }
};
