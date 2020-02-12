package com.renrenbit.rrwallet.network.cookie;

import android.os.AsyncTask;

/**
 * Created by jackQ on 2018/6/2.
 */
abstract class GuardedAsyncTask<Params, Progress>
        extends AsyncTask<Params, Progress, Void> {


    protected GuardedAsyncTask() {
    }

    @Override
    protected final Void doInBackground(Params... params) {
        try {
            doInBackgroundGuarded(params);
        } catch (RuntimeException e) {
            e.printStackTrace();
        }
        return null;
    }

    protected abstract void doInBackgroundGuarded(Params... params);
}
