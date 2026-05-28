FROM nginx:1.27-alpine

# Copy site assets
COPY . /usr/share/nginx/html/

# Remove any non-deployable files from the image
RUN rm -rf /usr/share/nginx/html/.git \
           /usr/share/nginx/html/.claude \
           /usr/share/nginx/html/.gitignore \
           /usr/share/nginx/html/Dockerfile \
           /usr/share/nginx/html/nginx.conf \
           /usr/share/nginx/html/CLAUDE.md \
           /usr/share/nginx/html/Inspiration \
           /usr/share/nginx/html/archive \
           /usr/share/nginx/html/scripts || true

# Custom nginx config: gzip + brotli + cache headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
