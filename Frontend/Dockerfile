# Utilisation de Node 24 (Alpine est léger et recommandé)
FROM node:24-alpine

# Définition du répertoire de travail
WORKDIR /app

# On installe les dépendances
# Copier package.json et package-lock.json d'abord permet d'optimiser le cache Docker
COPY package*.json ./
RUN npm install

# On copie le reste du projet
COPY . .

# On expose le port interne que Vite utilise par défaut
EXPOSE 5173

# On lance le serveur de développement
# Le --host 0.0.0.0 est CRUCIAL pour que Vite soit accessible depuis l'extérieur du conteneur
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]