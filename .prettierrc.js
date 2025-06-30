export default {
  // Largeur maximale de ligne
  printWidth: 80,

  // Utiliser 2 espaces pour l'indentation
  tabWidth: 2,

  // Utiliser des espaces au lieu des tabulations
  useTabs: false,

  // Ajouter un point-virgule à la fin des instructions
  semi: true,

  // Utiliser des guillemets simples
  singleQuote: true,

  // Utiliser des guillemets doubles pour les propriétés d'objet uniquement si nécessaire
  quoteProps: 'as-needed',

  // Utiliser des guillemets simples dans JSX
  jsxSingleQuote: true,

  // Ajouter une virgule à la fin des éléments dans les objets/tableaux multilignes
  trailingComma: 'es5',

  // Ajouter des espaces entre les accolades dans les objets
  bracketSpacing: true,

  // Placer la balise fermante > sur une nouvelle ligne pour les éléments JSX multilignes
  bracketSameLine: false,

  // Utiliser des parenthèses pour les paramètres de fonction arrow
  arrowParens: 'always',

  // Respecter les sauts de ligne existants
  endOfLine: 'lf',

  // Ne pas formater les fichiers markdown
  proseWrap: 'preserve',

  // Respecter les espaces dans les commentaires HTML
  htmlWhitespaceSensitivity: 'css',

  // Ne pas insérer de @format dans les fichiers
  insertPragma: false,

  // Ne pas exiger de pragma @format
  requirePragma: false,

  // Utiliser des guillemets simples pour les chaînes de caractères dans les templates
  singleAttributePerLine: false,

  // Configuration spécifique pour les fichiers TypeScript
  overrides: [
    {
      files: '*.ts',
      options: {
        parser: 'typescript',
      },
    },
    {
      files: '*.tsx',
      options: {
        parser: 'typescript',
        jsxSingleQuote: true,
      },
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
        printWidth: 120,
      },
    },
  ],
};
