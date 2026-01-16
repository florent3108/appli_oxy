module.exports = {
  apps: [
    {
      name: "appli-oxy",
      script: "npm",
      args: "start",
      cwd: "/var/www/appli_oxy",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
