import Network from "../common/network";
import storage, { STORAGE_KEY } from "../../util/Storage";

// 使用storage 的key-id方式来保存联系人数据
export default {
  async getContactList(uuid, page) {
    let contactList = [];

    try {
      contactList = await storage.getAllDataForKey(STORAGE_KEY.CONTACT_LIST);
    } catch (e) {
      console.log("获取联系人列表失败", e);
    }

    return contactList;
  },

  // 保存，判断是新增还是修改
  async save(param) {
    console.log("保存联系人入参+===>", param);
    if (param.id === null || param.id === undefined) {
      param.id = Date.now();
    }

    console.log("保存联系人====>", param);

    await storage.save({
      key: STORAGE_KEY.CONTACT_LIST,
      id: param.id,
      data: param,
    });
  },

  async deleteAll() {
    storage.clearMapForKey(STORAGE_KEY.CONTACT_LIST);
  },

  async delete(contactId) {
    storage.remove({
      key: STORAGE_KEY.CONTACT_LIST,
      id: contactId,
    });
  },
};
