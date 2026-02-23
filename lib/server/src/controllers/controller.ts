import type { Core, UID } from '@strapi/strapi';
import { FormattedStrapiEntry } from '../interface';
import { getPluginConfiguration } from '../utils';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  getMatchingContent(ctx) {
    const contentTypes = strapi.contentTypes;
    const body = ctx.request.body;

    const requestedContentTypes = body.contentTypes as string[];
    const keyword = body.keyword as string;
    const locale = body.locale as string;

    const mapping = requestedContentTypes.reduce(
      (accumulator, contentType) => {
        Object.keys(contentTypes).forEach((model) => {
          const strapiContentType = contentTypes[model];
          if (
            strapiContentType.info.singularName === contentType ||
            strapiContentType.info.pluralName === contentType
          ) {
            accumulator[contentType] = {
              uid: model as UID.ContentType,
              displayName: contentTypes[model].info.displayName,
              searchableField: strapi
                .plugin('multi-content-type-relation')
                .service('service')
                .getFirstStringFieldInContentType(contentTypes[model])
            };
          }
        });

        return accumulator;
      },
      {} as Record<
        string,
        { uid: UID.ContentType; displayName: string; searchableField: string }
      >
    );

    const promises = Object.keys(mapping).map((contentType) => {
      const uid = mapping[contentType].uid;

      return strapi
        .documents(uid)
        .findMany({
          filters: {
            [mapping[contentType].searchableField]: {
              $containsi: keyword
            }
          },
          locale,
          status: 'published'
        })
        .then((results) => {
          let contents = Array.isArray(results)
            ? results
            : typeof results === 'object' && results
              ? [results]
              : [];

          const contentTypeDefinition = strapi.contentType(uid);
          if (contentTypeDefinition?.options?.draftAndPublish) {
            contents = contents.filter(
              (content) => content.publishedAt !== null
            );
          }

          return {
            uid,
            displayName: mapping[contentType].displayName,
            searchableField: mapping[contentType].searchableField,
            results: contents
          };
        });
    });

    return Promise.all(promises);
  },
  validateRelations: async function (ctx) {
    const contentTypes = strapi.contentTypes;
    const body = ctx.request.body;

    const entries = body.entries as FormattedStrapiEntry[];

    const promises = entries.map((entry) => {
      if (!strapi.contentTypes[entry.uid]) {
        return Promise.resolve({ uid: entry.uid, result: null });
      }

      const findOneOptions = {
        documentId: entry.documentId,
        populate: '*',
        status: 'published'
      } as any
      if (entry.locale) {
        findOneOptions.locale = entry.locale
      }

      return strapi
        .documents(entry.uid as any)
        .findOne(findOneOptions)
        .then((result) => {
          return {
            uid: entry.uid,
            result
          };
        });
    });

    const responses = await Promise.all(promises);

    return responses
      .filter((response) => Boolean(response.result))
      .map((response) => {
        return {
          displayName: contentTypes[response.uid].info.displayName,
          uid: response.uid,
          searchableField: strapi
            .plugin('multi-content-type-relation')
            .service('service')
            .getFirstStringFieldInContentType(contentTypes[response.uid]),
          item: response.result
        };
      })
      .filter((entry) => entry.item);
  },
  listContentTypes: async function () {
    const contentTypes: Record<string, unknown>[] = [];

    for (const contentType of Object.values(strapi.contentTypes)) {
      if (
        (contentType.kind === 'collectionType' ||
          contentType.kind === 'singleType') &&
        !contentType.plugin
      ) {
        contentTypes.push(contentType);
      }
    }

    return contentTypes;
  },
  fetchRevertRelations: async function (ctx) {
    const body = ctx.request.body;
    let documentId = body.documentId as string;
    const uid = body.uid as UID.ContentType;
    const isSingleType = body.isSingleType as boolean;
    const locale = body.locale as string;

    if (isSingleType) {
      const document = await strapi.documents(uid).findFirst({
        populate: '*',
        status: 'published'
      });

      if (!document) return [];

      documentId = document.documentId;
    }

    const mctrRelations = await strapi
      .documents('plugin::multi-content-type-relation.mctr-relation')
      .findMany({
        filters: {
          target: {
            $containsi: `${uid}##${documentId}${locale ? `####${locale}` : ''}`
          }
        }
      });

    const relations = await Promise.all(
      mctrRelations.map(async (relation) => {
        let sourceDocumentId = relation.sourceDocId;
        let locale = null
        if (sourceDocumentId.includes('####')) {
          const [documentId, sourceLocale] = sourceDocumentId.split('####');
          locale = sourceLocale
          sourceDocumentId = documentId
        }
        const sourceUid = relation.sourceUID;

        const target = relation.target.find((target) =>
          target.includes(`${uid}##${documentId}`)
        );

        const [field] = target.split('##');

        const contentTypeName = Object.keys(strapi.contentTypes).find(
          (key) => strapi.contentTypes[key].uid === sourceUid
        );

        if (!contentTypeName) return null;

        const contentType = strapi.contentTypes[contentTypeName];

        const findOneOptions = {
          documentId: sourceDocumentId,
          populate: '*',
          status: 'published'
        } as any;
        if (locale) {
          findOneOptions.locale = locale
        }

        const document = await strapi.documents(sourceUid).findOne(findOneOptions);

        const searchableField = strapi
          .plugin('multi-content-type-relation')
          .service('service')
          .getFirstStringFieldInContentType(contentType);

        return {
          title: document[searchableField],
          uid: sourceUid,
          isSingleType: contentType.kind === 'singleType',
          field,
          type: contentType.info.displayName,
          documentId: sourceDocumentId
        };
      })
    );

    return relations.filter(Boolean);
  },
  getConfiguration: async function () {
    const configuration = getPluginConfiguration();
    return configuration;
  }
});
