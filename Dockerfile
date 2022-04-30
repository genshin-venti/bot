FROM node:18

ENV release_version=0.0.1-dev1

RUN npm config set registry https://registry.npmmirror.com \
    && curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

RUN curl -L -s "https://github.com/genshin-venti/bot/archive/refs/tags/v${release_version}.tar.gz" | tar xvz -C / \
    && mv "/bot-${release_version}" /bot

VOLUME ["/bot/db"]

WORKDIR /bot

RUN pnpm fetch  && pnpm install -r

ENTRYPOINT [ "pnpm", "start"]
