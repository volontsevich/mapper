FROM python:3.10-slim

WORKDIR /app
COPY . /app

RUN pip install --no-cache-dir -r config/requirements.txt

EXPOSE 8080

WORKDIR /app/src
CMD ["python", "server.py"]
