import type { Core, UID } from '@strapi/strapi';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.db.lifecycles.subscribe(async (event) => {
    if (!event.model.uid.includes('api::')) return;

    if (event.model.uid === 'plugin::multi-content-type-relation.mctr-relation')
      return;

    if (event.action === 'afterCreate') {
      const { documentId } = event.params.data;

      if (!documentId) return;

      try {
        console.log('[MCTR LIFECYCLE] Sync MCTR relation for ', documentId);
        await syncMctrRelation(documentId, event.model.uid as UID.ContentType);
      } catch (error) {
        console.error('[MCTR LIFECYCLE]', error);
      }
    }

    if (event.action === 'afterDelete') {
      // TODO: delete the mctr relation if needed
    }
  });
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
    console.log('[MCTR SYNC] Delete MCTR relations for ', documentId);
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

  console.log('[MCTR SYNC] Find document', documentId);
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
      console.error('[MCTR SYNC] Error parsing field', field, fieldValue);
    }
  });

  console.log('[MCTR SYNC] Target JSON', targetJSON);
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

  console.log('[MCTR SYNC] MCTR relation created');
};
export default bootstrap;
