package com.renrenbit.rrwallet.network.cookie;

import android.os.AsyncTask;

/**
 * Created by jackQ on 2018/6/2.
 */

abstract class GuardedResultAsyncTask<Result>
        extends AsyncTask<Void, Void, Result> {

    protected GuardedResultAsyncTask() {

    }

    @Override
    protected final Result doInBackground(Void... params) {
        try {
            return doInBackgroundGuarded();
        } catch (RuntimeException e) {
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    protected final void onPostExecute(Result result) {
        try {
            onPostExecuteGuarded(result);
        } catch (RuntimeException e) {
            e.printStackTrace();
        }
    }

    protected abstract Result doInBackgroundGuarded();

    protected abstract void onPostExecuteGuarded(Result result);
}
