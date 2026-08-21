# ==========================================
# مرحله ۱: توسعه (Development Stage)
# ==========================================
FROM node:26-alpine AS dev-stage
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir /app && chown appuser:appgroup /app
WORKDIR /app
COPY --chown=appuser:appgroup package*.json ./
USER appuser
RUN npm install
COPY --chown=appuser:appgroup . .
# اگر کانتینر در حالت dev-stage متوقف شود، همینجا می‌ماند و آماده Hot-Reload است.

# ==========================================
# مرحله ۲: بیلد (Build Stage)
# ==========================================
FROM dev-stage AS build-stage
# این دستور موقع "ساخت ایمیج" اجرا می‌شود، نه موقع روشن شدن کانتینر!
RUN npm run build

# ==========================================
# مرحله ۳: پروداکشن (Production Stage)
# ==========================================
FROM nginx:1.31-alpine AS prod-stage
# فقط پوشه out از مرحله قبل کپی می‌شود. هیچ خبری از Node.js و فایل‌های سورس نیست.
COPY --from=build-stage /app/out /usr/share/nginx/html
EXPOSE 80