ARG DOCKER_IMAGE_REGISTRY=docker.io
ARG PYTHON_VERSION=3.11-slim


FROM ${DOCKER_IMAGE_REGISTRY}/library/python:${PYTHON_VERSION} AS dev-stage

LABEL maintainer="your-team@example.com" \
      tier="backend" \
      lifecycle="development"

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN mkdir /app && chown appuser:appgroup /app
WORKDIR /app
COPY --chown=appuser:appgroup requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=appuser:appgroup . .
USER appuser
EXPOSE 8000
CMD ["python", "manage.py", "runsslserver", "0.0.0.0:8000", "--certificate", "/certs/nginx.crt", "--key", "/certs/nginx.key"]


FROM ${DOCKER_IMAGE_REGISTRY}/library/python:${PYTHON_VERSION} AS obfuscator

RUN pip install --no-cache-dir pyarmor build

WORKDIR /src
COPY MyApp/ ./MyApp/
COPY MyCore/ ./MyCore/
COPY manage.py .
COPY pyproject.toml .

# مبهم‌سازی recursive دو پکیج اصلی پروژه
RUN pyarmor gen -O /build/obfuscated -r MyApp MyCore \
    && cp manage.py pyproject.toml /build/obfuscated/

# ساخت wheel از کد مبهم‌شده
WORKDIR /build/obfuscated
RUN python -m build --wheel --outdir /build/dist


FROM ${DOCKER_IMAGE_REGISTRY}/library/python:${PYTHON_VERSION} AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .

ARG PIP_INDEX_URL=https://pypi.org/simple
RUN pip install --user --index-url ${PIP_INDEX_URL} -r requirements.txt


FROM ${DOCKER_IMAGE_REGISTRY}/library/python:${PYTHON_VERSION} AS prod-stage

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system appgroup && adduser --system --ingroup appgroup --home /home/appuser appuser
WORKDIR /app

# وابستگی‌های سوم‌شخص (Django, DRF, gunicorn و ...)
COPY --chown=appuser:appgroup --from=builder /root/.local /home/appuser/.local

# فقط فایل wheel مبهم‌شده — نه یک خط سورس خام
COPY --chown=appuser:appgroup --from=obfuscator /build/dist/*.whl /tmp/wheels/

# manage.py صرفاً یک اسکریپت CLI کوچک بدون منطق حساس است؛ جدا کپی می‌شود
COPY --chown=appuser:appgroup manage.py .
COPY --chown=appuser:appgroup --from=obfuscator /build/obfuscated/pyarmor_runtime_000000 /app/pyarmor_runtime_000000/
RUN chown -R appuser:appgroup /app

USER appuser
ENV PYTHONUSERBASE=/home/appuser/.local \
    PATH=/home/appuser/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
RUN pip install --user --no-index --find-links=/tmp/wheels mycore-backend \
    && rm -rf /app/wheels
EXPOSE 8001

CMD ["gunicorn", "MyCore.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "30"]