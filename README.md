# Application de Gestion de Maintenance PHP

Application de gestion de maintenance développée avec le [T3 Stack](https://create.t3.gg/).

## Technologies utilisées

Ce projet utilise les technologies suivantes :

- [Next.js](https://nextjs.org) - Framework React pour le développement web
- [Drizzle ORM](https://orm.drizzle.team) - ORM TypeScript pour PostgreSQL
- [tRPC](https://trpc.io) - API type-safe end-to-end
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS utilitaire
- [shadcn/ui](https://ui.shadcn.com) - Composants UI réutilisables
- [TanStack Table](https://tanstack.com/table) - Tableau de données avec virtualisation
- [PostgreSQL](https://www.postgresql.org) - Base de données relationnelle

## Installation

1. Cloner le dépôt
2. Copier `.env.example` vers `.env` et configurer vos variables d'environnement :
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```
3. Installer les dépendances :
   ```bash
   npm install
   ```
4. Générer les migrations de base de données :
   ```bash
   npm run db:push
   ```
5. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## Fonctionnalités

- Gestion complète des enregistrements de maintenance
- Interface de tableau avec édition en ligne
- 5 lignes vides toujours disponibles pour une saisie rapide
- Filtrage par colonnes et recherche globale
- Copier/coller depuis Excel
- Sélection multiple et suppression en lot
- Validation des dates avec format français (JJ/MM/AAAA HH:MM)
- Mises à jour optimistes pour une interface fluide
- Virtualisation pour de meilleures performances avec de grandes quantités de données

## Commandes disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Compiler l'application pour la production
- `npm run start` - Démarrer le serveur de production
- `npm run db:push` - Synchroniser le schéma de base de données
- `npm run db:studio` - Ouvrir Drizzle Studio pour gérer la base de données

## En savoir plus

Pour en savoir plus sur le T3 Stack, consultez les ressources suivantes :

- [Documentation T3 Stack](https://create.t3.gg/)
- [Dépôt GitHub create-t3-app](https://github.com/t3-oss/create-t3-app)

## Déploiement

Consultez les guides de déploiement pour [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) et [Docker](https://create.t3.gg/en/deployment/docker).
