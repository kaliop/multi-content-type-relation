import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardBody,
  Flex,
  Divider
} from '@strapi/design-system';
import { CardTitle, CardContent, CardBadge } from '@strapi/design-system';
import { getFetchClient } from '@strapi/strapi/admin';
import pluginId from '../../pluginId';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { Loader } from '@strapi/design-system';

interface LinkedContent {
  documentId: string;
  title: string;
  type: string;
  uid: string;
  field: string;
  isSingleType: boolean;
}

interface SidePanelProps {
  contentType?: string;
  contentId?: string;
}

const SidePanel: React.FC<SidePanelProps> = () => {
  const {
    id: documentId,
    model: uid,
    isSingleType
  } = useContentManagerContext();

  const [linkedContent, setLinkedContent] = useState<LinkedContent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRevertRelations = async () => {
      const { post } = getFetchClient();

      const response = await post(`/${pluginId}/fetch-revert-relations`, {
        documentId,
        uid,
        isSingleType
      });

      setLinkedContent(response.data);
      setLoading(false);
    };

    fetchRevertRelations();
  }, []);

  if (loading)
    return (
      <Box width="100%">
        <Loader />
      </Box>
    );

  return (
    <Box width="100%">
      <Flex>
        <Typography variant="beta" fontWeight="bold" marginBottom={2}>
          Contenus liés
        </Typography>
      </Flex>

      {linkedContent.length > 0 ? (
        <Flex>
          <Typography variant="omega" textColor="neutral600" marginBottom={3}>
            Ce contenu est référencé dans {linkedContent.length} autre(s)
            contenu(s)
          </Typography>
        </Flex>
      ) : (
        <Flex>
          <Typography variant="omega" textColor="neutral600" marginBottom={3}>
            Ce contenu n'est pas référencé dans d'autres contenus
          </Typography>
        </Flex>
      )}

      {linkedContent.map((content) => (
        <Card key={content.documentId} marginBottom={2}>
          <CardBody>
            <CardContent>
              <a
                href={
                  content.isSingleType
                    ? `/admin/content-manager/single-types/${content.uid}`
                    : `/admin/content-manager/collection-types/${content.uid}/${content.documentId}`
                }
                target="_blank"
              >
                <CardTitle>
                  {content.title} ({content.field})
                </CardTitle>
              </a>
            </CardContent>

            <CardBadge>{content.type}</CardBadge>
          </CardBody>
        </Card>
      ))}
    </Box>
  );
};

export default SidePanel;
