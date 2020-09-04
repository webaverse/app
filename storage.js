const storage = {
  async get(k) {
    const res = await fetch(`/xrpackage/storage/${k}`);
    if (res.status >= 200 && res.status < 300) {
      return await res.json();
    } else {
      return undefined;
    }
  },
  async getRaw(k) {
    const res = await fetch(`/xrpackage/storage/${k}`);
    if (res.status >= 200 && res.status < 300) {
      return await res.arrayBuffer();
    } else {
      return undefined;
    }
  },
  set(k, v) {
    return this.setRaw(k, JSON.stringify(v));
  },
  async setRaw(k, v) {
    const res = await fetch(`/xrpackage/storage/${k}`, {
      method: 'PUT',
      body: v,
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
  async keys() {
    const res = await fetch(`/xrpackage/storage/`);
    if (res.status >= 200 && res.status < 300) {
      return await res.json();
    } else {
      return undefined;
    }
  },
};
export default storage;
