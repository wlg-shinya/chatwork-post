# chatwork-post

## Project setup

```
$ npm install
```

### DB startup

```
$ docker-compose up db
```

### Build and run for development

```
$ npm run dev && npm run serve
```

### Build and run for production

```
$ npm run build && npm run preview && npm run serve
```

## Deploy

```
$ npm run clean && docker-compose up --build
```
