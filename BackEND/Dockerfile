FROM python:3.11-slim
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN mkdir /app && chown appuser:appgroup /app
WORKDIR /app
COPY --chown=appuser:appgroup requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=appuser:appgroup . .
USER appuser
EXPOSE 8000
CMD ["python", "manage.py", "runsslserver", "0.0.0.0:8000", "--certificate", "/nginx.crt", "--key", "/nginx.key"]   