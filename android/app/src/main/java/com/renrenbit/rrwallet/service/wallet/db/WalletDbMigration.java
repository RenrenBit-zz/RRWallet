package com.renrenbit.rrwallet.service.wallet.db;

import io.realm.DynamicRealm;
import io.realm.RealmMigration;

/**
 * Created by jackQ on 2018/6/23.
 */

class WalletDbMigration implements RealmMigration {
    @Override
    public void migrate(DynamicRealm realm, long oldVersion, long newVersion) {
//        RealmSchema schema = realm.getSchema();
//        if (oldVersion == 0) {
//            schema.get(Constants.WALLET_DB_TABLE)
//                    .addField("private_key", String.class);
//            oldVersion++;
//        }
    }
}
