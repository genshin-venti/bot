FROM node:18

#cqhttp
RUN sed -i "s@http://\(deb\|security\).debian.org@https://mirrors.aliyun.com@g" /etc/apt/sources.list \
    && apt-get update \
    && apt-get install ffmpeg -y

#VOLUME ["/cqhttp/data", "/cqhttp/logs"]

WORKDIR /cqhttp

COPY ["./go-cqhttp/config.yml", "./go-cqhttp/device.json", "/cqhttp/"]

RUN wget -qO- https://github.com/Mrs4s/go-cqhttp/releases/latest/download/go-cqhttp_linux_amd64.tar.gz | tar xvz -C /cqhttp \
    && chmod +x /cqhttp/go-cqhttp

#bot
ENV release_version=0.0.1-dev1

RUN npm config set registry https://registry.npmmirror.com \
    && curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

RUN curl -L -s "https://github.com/genshin-venti/bot/archive/refs/tags/v${release_version}.tar.gz" | tar xvz -C / \
    && mv "/bot-${release_version}" /bot

VOLUME ["/bot/db"]

RUN cd /bot && pnpm fetch  && pnpm install -r

CMD  cd /cqhttp && ./go-cqhttp -d -faststart && cd /bot && pnpm start
