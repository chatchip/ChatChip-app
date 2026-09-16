FROM caddy:2-alpine

WORKDIR /app
COPY Caddyfile /etc/caddy/Caddyfile
COPY public /app/public

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
