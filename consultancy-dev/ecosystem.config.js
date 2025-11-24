module.exports = {
    apps: [
        {
            name: 'consultancy-frontend',
            script: 'npm',
            args: 'start',
            cwd: '/home/ubuntu/consultancy-frontend',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: '/var/log/pm2/consultancy-frontend-error.log',
            out_file: '/var/log/pm2/consultancy-frontend-out.log',
            log_file: '/var/log/pm2/consultancy-frontend-combined.log',
            time: true,
        },
    ],
};
