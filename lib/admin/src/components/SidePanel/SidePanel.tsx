import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardBody,
  Flex,
  Divider,
} from '@strapi/design-system';
import { CardTitle } from '@strapi/design-system';
import { CardContent } from '@strapi/design-system';
import { CardBadge } from '@strapi/design-system';

interface LinkedContent {
  id: string;
  title: string;
  type: 'article' | 'author' | 'category';
  status: 'published' | 'draft';
  lastModified: string;
}

interface SidePanelProps {
  contentType?: string;
  contentId?: string;
}

const SidePanel: React.FC<SidePanelProps> = () => {
  // Données mockées pour simuler les contenus liés
  const mockLinkedContent: LinkedContent[] = [
    {
      id: '1',
      title: 'Comment optimiser votre SEO en 2024',
      type: 'article',
      status: 'published',
      lastModified: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      title: 'Marie Dupont',
      type: 'author',
      status: 'published',
      lastModified: '2024-01-10T14:20:00Z',
    },
    {
      id: '3',
      title: 'Marketing Digital',
      type: 'category',
      status: 'published',
      lastModified: '2024-01-05T09:15:00Z',
    },
    {
      id: '4',
      title: 'Les tendances du développement web',
      type: 'article',
      status: 'draft',
      lastModified: '2024-01-12T16:45:00Z',
    },
  ];

  return (
    <Box width='100%'>
      <Flex>
        <Typography variant='beta' fontWeight='bold' marginBottom={2}>
          Contenus liés
        </Typography>
      </Flex>

      <Flex>
        <Typography variant='omega' textColor='neutral600' marginBottom={3}>
          Ce contenu est référencé dans {mockLinkedContent.length} autre(s)
          contenu(s)
        </Typography>
      </Flex>

      <Box marginTop={3}>
        {mockLinkedContent.map((content) => (
          <Card key={content.id} marginBottom={2} hasRadius>
            <CardBody padding={2}>
              <CardContent>
                <CardTitle>{content.title}</CardTitle>
              </CardContent>
              <CardBadge>{content.type}</CardBadge>
            </CardBody>
          </Card>
        ))}
      </Box>

      <Divider marginTop={3} marginBottom={3} />

      <Typography variant='omega' textColor='neutral600' textAlign='center'>
        Cliquez sur un contenu pour le modifier
      </Typography>
    </Box>
  );
};

export default SidePanel;
