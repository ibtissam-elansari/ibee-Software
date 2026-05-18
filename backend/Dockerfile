FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -U pip \
  && pip install --no-cache-dir -r requirements.txt

COPY app /app/app
COPY start.sh /app/start.sh

# Download classifier.pkl from GitHub Releases (too large for git)
RUN curl -L \
  "https://github.com/ibtissam-elansari/ibee-Software/releases/download/v1.0-models/classifier.pkl" \
  -o /app/app/ai/classifier.pkl

RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]