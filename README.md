# chatpost

## Project setup

```
npm install
```

### DB setup

```
$ psql -d postgres -U [YourUsername]
# CREATE DATABASE chatpost;
# \connect chatpost
# CREATE TABLE register (id serial, room_id integer, body text, self_unread boolean);
```

### Compiles and hot-reloads for development

```
npm run dev && npm run serve
```

### Compiles and minifies for production

```
npm run build && npm run serve
```

## Deploy

```
docker-compose build && docker-compose up
```
