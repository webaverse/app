const storage = {
  async get(k) {
    const res = await fetch(`/xrpackage/storage/${k}`);
    if (res.status >= 200 && res.status < 300) {
      const s = await res.text();
      return JSON.parse(s);
    } else {
      return undefined;
    }
  },
  async set(k, v) {
    const res = await fetch(`/xrpackage/storage/${k}`, {
      method: 'PUT',
      body: JSON.stringify(v),
    });
    if (res.status >= 200 && res.status < 300) {
      // nothing
    } else {
      throw new Error(`invalid status code: ${res.status}`);
    }
  },
  async remove(k) {
    const res = await fetch(`/xrpackage/storage/${k}`, {
      method: 'DELETE',
    });
    if (res.status >= 200 && res.status < 300) {
      // nothing
    } else {
      throw new Error(`invalid status code: ${res.status}`);
    }
  },
};
export default storage;