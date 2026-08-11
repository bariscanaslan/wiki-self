# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first, using only the csproj, so dependency layers are cached across source changes.
COPY src/WikiSelf/WikiSelf.csproj src/WikiSelf/
RUN dotnet restore src/WikiSelf/WikiSelf.csproj

COPY src/WikiSelf/ src/WikiSelf/
RUN dotnet publish src/WikiSelf/WikiSelf.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# libgssapi-krb5-2 silences a harmless-but-noisy Npgsql warning on this slim base image
# (it only affects Kerberos/GSSAPI auth, which this app doesn't use for Postgres).
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --user-group --create-home --shell /usr/sbin/nologin wikiself \
    && mkdir -p /app/AssetStorage \
    && chown -R wikiself:wikiself /app

COPY --from=build --chown=wikiself:wikiself /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:7000 \
    DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 7000
USER wikiself

ENTRYPOINT ["dotnet", "WikiSelf.dll"]
