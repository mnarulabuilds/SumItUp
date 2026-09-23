# syntax=docker/dockerfile:1

FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

FROM base AS deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM deps AS development
ENV NODE_ENV=development
COPY . .
RUN mkdir -p uploads pdfs
EXPOSE 3000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000", "--reload"]

FROM deps AS test
ENV NODE_ENV=test
ENV JWT_SECRET=test-jwt-secret-key-for-unit-tests
ENV MONGODB_URI=mongodb://mongodb:27017/sumitup-test
COPY . .
CMD ["pytest", "-q"]

FROM deps AS production
ENV NODE_ENV=production
COPY . .
RUN mkdir -p uploads pdfs
ENV PORT=3000
ENV UPLOAD_PATH=/app/uploads
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:3000/')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000"]
