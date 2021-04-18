FROM luciantin/base-ubuntu-xvfb-node

WORKDIR /home

COPY package*.json ./
COPY imageHelper.js ./
COPY vCamera.js ./
COPY vDroneHandler.js ./
COPY server.js ./
COPY start.sh ./

RUN npm install .
RUN chmod +x start.sh
RUN apt-get install dos2unix
RUN dos2unix start.sh

#CMD ["/bin/bash"]
CMD ["./start.sh"]