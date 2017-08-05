export function camelCaseToSpaces(value) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

export function unwindObject(obj) {
  obj = {...obj};

  Object.keys(obj).forEach(key => {
    if (obj[key] && obj[key].$t) {
      obj[key] = obj[key].$t;
    } else {
      delete obj[key];
    }
  });

  return obj;
}

export function unwindArray(arr) {
  arr = [].concat(arr);

  return (arr)
    .map(obj => obj && obj.$t)
    .filter(val => val);
}

export function unwindPhotos(arr): Photo[] {
  arr = Array.isArray(arr) ? arr : [];

  return arr
    .map(photo => {
      if (typeof photo !== 'object') return;

      return {
        id: photo['@id'],
        size: Number((/width=(\d*)/.exec(photo.$t) || [])[1]) || 0,
        url: photo.$t,
      };
    })
    .filter(photo => photo);
}

export interface Pet {
  age?: string;
  animal?: string;
  breeds: string[];
  contact: {
    address1?: string;
    address2?: string;
    city?: string;
    email?: string;
    fax?: string;
    phone?: string;
    state?: string;
    zip?: string;
  };
  description?: string;
  id?: string;
  lastUpdate?: string;
  mix?: string;
  name?: string;
  options: string[];
  photos: Photo[];
  sex?: string;
  shelterId?: string;
  shelterPetId?: string;
  size?: string;
  status?: string;
}

export interface Photo {
  id: string;
  size: number;
  url: string;
}

export interface Shelter {
  address1?: string;
  address2?: string;
  city?: string;
  country?: string;
  email?: string;
  fax?: string;
  id?: string;
  latitude?: string;
  longitude?: string;
  name?: string;
  phone?: string;
  state?: string;
  zip?: string;
}
