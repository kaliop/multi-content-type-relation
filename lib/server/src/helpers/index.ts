import { isEmpty, merge } from "lodash/fp";


export const flattenObj = (
  obj: any,
  parent: any,
  res: Record<string, any> = {}
) => {
  for (let key in obj) {
    let propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] == 'object') {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

export const unflatten = (data: any) => {
  var result = {};
  for (var i in data) {
    var keys = i.split('.');
    keys.reduce(function (r: any, e, j) {
      return (
        r[e] ||
        (r[e] = isNaN(Number(keys[j + 1]))
          ? keys.length - 1 == j
            ? data[i]
            : {}
          : [])
      );
    }, result);
  }
  return result;
};


const getModelPopulationAttributes = (model) => {
  if (model.uid === "plugin::upload.file") {
    const { related, ...attributes } = model.attributes;
    return attributes;
  }

  return model.attributes;
};

export const getFullPopulateObject = (modelUid, maxDepth = 20, ignore) => {
  if (maxDepth <= 1) {
    return true;
  }
  if (modelUid === "admin::user") {
    return undefined;
  }

  const populate = {};
  const model = strapi.getModel(modelUid);
  if (ignore && !ignore.includes(model.collectionName))
    ignore.push(model.collectionName);
  for (const [key, value] of Object.entries(
      getModelPopulationAttributes(model)
  )) {
    if (ignore?.includes(key)) continue;
    if (value) {
      if ((value as any).type === "component") {
        populate[key] = getFullPopulateObject((value as any).component, maxDepth - 1, ignore);
      } else if ((value as any).type === "dynamiczone") {
        const dynamicPopulate = (value as any).components.reduce((prev, cur) => {
          const curPopulate = getFullPopulateObject(cur, maxDepth - 1, ignore);
          return merge(prev, {[cur]: curPopulate});
        }, {});
        populate[key] = isEmpty(dynamicPopulate) ? true : { on: dynamicPopulate };
      } else if ((value as any).type === "relation") {
        const relationPopulate = getFullPopulateObject(
            (value as any).target,
            key === "localizations" && maxDepth > 2 ? 1 : maxDepth - 1,
            ignore
        );
        if (relationPopulate) {
          populate[key] = relationPopulate;
        }
      } else if ((value as any).type === "media") {
        populate[key] = true;
      }
    }
  }
  return isEmpty(populate) ? true : { populate };
};