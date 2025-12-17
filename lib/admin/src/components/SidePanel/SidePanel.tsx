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
import useTranslate from '../../hooks/useTranslate';

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
  const { translate } = useTranslate();
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

      setLinkedContent(Array.isArray(response.data) ? response.data.filter(Boolean) : []);
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
    <>
      <Divider />
      <Box width="100%" marginTop={4}>
        <Flex>
          <Typography
            variant="sigma"
            fontWeight="bold"
            textTransform="uppercase"
            marginBottom={1}
            textColor="neutral600"
          >
            {translate('sidePanel.linkedContent')}
          </Typography>
        </Flex>

        {linkedContent.length > 0 ? (
          <Flex>
            <Typography variant="omega" textColor="neutral600" marginBottom={3}>
              {translate('sidePanel.referencedIn')} {linkedContent.length}{' '}
              {translate('sidePanel.otherContents')}
            </Typography>
          </Flex>
        ) : (
          <Flex>
            <Typography variant="omega" textColor="neutral600" marginBottom={3}>
              {translate('sidePanel.notReferenced')}
            </Typography>
          </Flex>
        )}

        <Box marginTop={2}>
          {linkedContent.map((content, idx) => (
            <Box
              key={content.documentId}
              marginBottom={idx < linkedContent.length - 1 ? 3 : 0}
            >
              <Flex
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                paddingY={2}
                paddingX={3}
              >
                <Box>
                  <Box>
                    <a
                      href={
                        content.isSingleType
                          ? `/admin/content-manager/single-types/${content.uid}`
                          : `/admin/content-manager/collection-types/${content.uid}/${content.documentId}`
                      }
                      target="_blank"
                      style={{ textDecoration: 'none' }}
                    >
                      <Typography
                      >
                        {content.title ?? content.documentId}
                      </Typography>
                    </a>
                  </Box>
                  <Box marginTop={1}>
                    <Typography
                      variant="pi"
                      textColor="neutral600"
                      style={{ lineHeight: 1.2 }}
                    >
                      {translate('sidePanel.field')} {content.field}
                    </Typography>
                  </Box>
                </Box>
                <Box marginLeft={2}>
                  <CardBadge>{content.type}</CardBadge>
                </Box>
              </Flex>
              {idx < linkedContent.length - 1 && (
                <Box marginY={1}>
                  <Divider />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
};

export default SidePanel;
