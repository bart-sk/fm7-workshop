import { ObjectID } from 'mongodb';
import { RESTErrorNotFound } from './errors';

export const objectid = (oid, throws = true) => {
  try {
    return ObjectID(oid);
  } catch (err) {
    if (throws) {
      if (throws instanceof Error) {
        throw throws;
      } else {
        throw new RESTErrorNotFound();
      }
    }
    return null;
  }
};

export const text2ascii = text => {
  return text
    .replace(/[áàãâä]/gi, 'a')
    .replace(/[čç]/gi, 'c')
    .replace(/[ď]/gi, 'd')
    .replace(/[éèê]/gi, 'e')
    .replace(/[íìïî]/gi, 'i')
    .replace(/[ľĺ]/gi, 'l')
    .replace(/[ñň]/gi, 'n')
    .replace(/[óòöôõ]/gi, 'o')
    .replace(/[ř]/gi, 'r')
    .replace(/[š]/gi, 's')
    .replace(/[ť]/gi, 't')
    .replace(/[úùüûů]/gi, 'u')
    .replace(/[ý]/gi, 'y')
    .replace(/[ž]/gi, 'z');
};

export const createFtsItems = (strings, split = ' ') => {
  const preparedStrings = strings.map(a => {
    return a
      ? text2ascii(a.toString())
          .toLowerCase()
          .trim()
      : '';
  });

  const ftsItems = preparedStrings.reduce((all, ftsPart) => {
    const finalParts = split ? ftsPart.split(split) : [ftsPart];
    finalParts.map(finalPart => {
      for (let i = 1; i <= finalPart.length; i += 1) {
        const ftsItem = finalPart.substring(0, i).trim();
        all.add(ftsItem);
      }
      return finalPart;
    });
    return all;
  }, new Set());

  return [...ftsItems].sort();
};

export const schema2projection = (schema, subObject = null) => {
  let projection = {};
  if (schema.properties) {
    if (subObject && subObject.length) {
      // rozdelime subObject pre kazdu cast a hladame zaradom, redukujeme
      const subObjectParts = subObject.split('.');
      let subObjectPart = null;
      do {
        subObjectPart = subObjectParts.shift();
        const subScheme = schema.properties[subObjectPart];
        if (subScheme) {
          projection = schema2projection(subScheme, subObjectParts.join('.'));
        }
      } while (subObjectPart);
    } else {
      Object.keys(schema.properties).map(k => {
        projection[k] = true;
        return k;
      });
    }
  } else if (schema.allOf) {
    // pohladame v kazdej scheme properties / pripadne subObject
    schema.allOf.reduce((p, sch) => {
      return Object.assign(p, schema2projection(sch, subObject));
    }, projection);
  } else if (schema.type === 'array') {
    projection = Object.assign(
      projection,
      schema2projection(schema.items, subObject),
    );
  }
  return projection;
};

export const sorter2sorter = sorter => {
  const s = {};
  if (sorter[0] === '-') {
    s[sorter.substring(1)] = -1;
  } else {
    s[sorter] = 1;
  }
  return s;
};

export const filterValues2mongo = (
  values,
  spajac = '$in',
  forceArray = false,
) => {
  if (Array.isArray(values)) {
    if (values.length > 1 || forceArray) {
      return { [spajac]: [...values] };
    }
    return values[0];
  } else if (typeof values === 'object' && Symbol.iterator in values) {
    return { [spajac]: [...values] };
  }
  return values;
};

export function slugify(text) {
  return text2ascii(text)
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '');
}

export function round(number, precision) {
  const factor = 10 ** precision;
  const tempNumber = number * factor;
  const roundedTempNumber = Math.round(tempNumber);
  return roundedTempNumber / factor;
}
