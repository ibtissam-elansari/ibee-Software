FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -U pip \
  && pip install --no-cache-dir -r requirements.txt

COPY app /app/app
COPY start.sh /app/start.sh

# Download AI models from GitHub Releases (too large or problematic for git)
RUN apt-get update && apt-get install -y --no-install-recommends wget \
  && wget -q "https://github.com/ibtissam-elansari/ibee-Software/releases/download/v1.0-models/classifier.pkl" \
     -O /app/app/ai/classifier.pkl \
  && wget -q "https://github.com/ibtissam-elansari/ibee-Software/releases/download/v1.0-models/isolation_forest.pkl" \
     -O /app/app/ai/isolation_forest.pkl \
  && apt-get purge -y wget && rm -rf /var/lib/apt/lists/*

RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]