// ref. https://note.com/shift_tech/n/ne1c160a36aa9

export default (options: any) => {
  const {
    app: {
      _router: { stack: layers },
    },
  } = options;
  const routingList = {};

  const routerStacks = layers.filter((layer: any) => layer.handle.stack && layer.name === "router");
  const routeLayers = layers.filter((layer: any) => layer.route);

  routerStacks.forEach((routerStack: any) => {
    const basePath = routerStack.regexp.toString().replaceAll("\\", "").replace("/^", "").replace("/?(?=/|$)/i", "");

    routerStack.handle.stack.forEach((stack: any) => {
      const {
        route: { path, methods },
      } = stack;

      if (routingList[`${basePath}${path}`]) {
        routingList[`${basePath}${path}`].push(Object.keys(methods).shift());
        return;
      }
      routingList[`${basePath}${path}`] = [Object.keys(methods).shift()];
    });
  });

  routeLayers.forEach((layer: any) => {
    const {
      route: { path, methods },
    } = layer;

    if (routingList[path]) {
      routingList[path].push(Object.keys(methods).shift());
      return;
    }
    routingList[path] = [Object.keys(methods).shift()];
  });

  return routingList;
};
