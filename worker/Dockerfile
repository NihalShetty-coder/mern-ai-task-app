FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt ./
RUN pip install --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
RUN useradd -m appuser
COPY --from=builder /root/.local /home/appuser/.local
COPY app.py ./
ENV PATH=/home/appuser/.local/bin:$PATH
USER appuser
CMD ["python", "app.py"]
