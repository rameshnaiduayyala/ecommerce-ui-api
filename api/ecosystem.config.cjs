module.exports = {
  apps: [
    {
      name: "ecommerce-api",
      script: "./main.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env_production: {
        NODE_ENV: "production"
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true
    }
  ]
};
