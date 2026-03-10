import type { Core } from '@strapi/types';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async migrateV4ToV5() {
    strapi.log.info('🚀 Starting MCTR Data Migration (v4 -> v5)...');

    const contentTypes = Object.values(strapi.contentTypes);
    const components = Object.values(strapi.components);
    const allSchemas = [...contentTypes, ...components];

    const affectedFields: {
      uid: string;
      fieldName: string;
    }[] = [];

    // 1. Discover all fields. 
    for (const schema of allSchemas) {
      for (const [fieldName, attribute] of Object.entries(schema.attributes)) {
        if (attribute.type === 'richtext' || attribute.type === 'string' || (attribute as any).type === 'customField') {
          affectedFields.push({
            uid: schema.uid,
            fieldName,
          });
        }
      }
    }

    strapi.log.info(`🔍 Scanning ${affectedFields.length} potential fields for MCTR data.`);

    let totalMigratedRelations = 0;
    let totalUpdatedRows = 0;

    for (let i = 0; i < affectedFields.length; i++) {
      const field = affectedFields[i];
      
      const rows = await strapi.db.query(field.uid as any).findMany({
        where: {
          [field.fieldName]: { $notNull: true },
        },
      });

      if (rows.length === 0) continue;

      let fieldUpdatedRows = 0;

      for (const row of rows) {
        const rawValue = row[field.fieldName];
        if (typeof rawValue !== 'string' || !rawValue.includes('"MRCT":true')) continue;

        let data;
        try {
          data = JSON.parse(rawValue);
        } catch (e) {
          continue;
        }

        if (!Array.isArray(data)) continue;

        let rowUpdated = false;
        const newData = [];

        for (const item of data) {
          if (item.documentId || !item.id || !item.uid) {
            newData.push(item);
            continue;
          }

          try {
            const targetRow = await strapi.db.query(item.uid as any).findOne({
              where: { id: item.id },
              select: ['documentId', 'locale'],
            });

            if (targetRow) {
              newData.push({
                uid: item.uid,
                documentId: targetRow.documentId,
                locale: targetRow.locale,
                MRCT: true,
              });
              rowUpdated = true;
              totalMigratedRelations++;
            } else {
              newData.push(item);
            }
          } catch (err) {
            newData.push(item);
          }
        }

        if (rowUpdated) {
          await strapi.db.query(field.uid as any).update({
            where: { id: row.id },
            data: {
              [field.fieldName]: JSON.stringify(newData),
            },
          });
          fieldUpdatedRows++;
          totalUpdatedRows++;
        }
      }
      
      if (fieldUpdatedRows > 0) {
        strapi.log.info(`[${i + 1}/${affectedFields.length}] ✅ Migrated ${fieldUpdatedRows} rows in ${field.uid} (${field.fieldName})`);
      }
    }

    strapi.log.info(`✅ MCTR Migration finished! Migrated ${totalMigratedRelations} relations in ${totalUpdatedRows} rows.`);
    return { success: true, rows: totalUpdatedRows, relations: totalMigratedRelations };
  },
});
