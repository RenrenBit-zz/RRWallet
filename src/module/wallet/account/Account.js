import { computed } from "mobx";
import _ from "lodash";

class Account {
  id;
  /**
   *
   * @type { String }
   * @memberof MultiChainAccount
   */
  name;
  type;
  @computed get totalAsset() {
    throw new Error("not implemented totalAsset");
  }
  @computed get floatingAsset() {
    throw new Error("not implemented floatingAsset");
  }

  /**
   * 更新account相关业务数据, AccountStore会轮询该方法
   *
   * @memberof Account
   */
  update = async () => {
    throw new Error("not implemented update");
  };

  /**
   * 定时轮询
   *
   * @memberof Account
   */
  pollingUpdateTask = () => {
    this.update().finally(() => {
      setTimeout(this.pollingUpdateTask, _.random(60, 80) * 1000);
    });
  };
  constructor(obj = {}) {
    this.id = obj.id;
    this.name = obj.name;
    this.type = obj.type;
    setTimeout(() => {
      this.pollingUpdateTask();
    }, 0);
  }
}

export default Account;
