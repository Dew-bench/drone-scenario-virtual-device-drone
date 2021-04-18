FROM ubuntu:20.04
# docker run -t -i ubuntu /bin/bash
ENV DEBIAN_FRONTEND noninteractive

WORKDIR /home

COPY package*.json ./
COPY ../server.js ./
COPY start.sh  ./

# Update
RUN apt-get update -y \
 && apt-get install -y \
 build-essential \
 libxi-dev \
 libglu1-mesa-dev \
 libglew-dev \
 pkg-config \
 mesa-utils \
 xvfb \
 libgl1-mesa-dri \
 libglapi-mesa \
 libosmesa6 \
 npm \
 curl \
 wget \
 && chmod +x ./start.sh \
 && npm install -g n \
 && n stable \
 && PATH="$PATH" \
 && exec bash \
 && npm install .\

CMD ["./start.sh"]

