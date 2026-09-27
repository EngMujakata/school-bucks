const CACHE_NAME =
  'school-bucks-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];


self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(cache =>
          cache.addAll(
            APP_SHELL
          )
        )

    );

    self.skipWaiting();

  }
);


self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(keys =>

          Promise.all(

            keys
              .filter(
                key =>
                  key !== CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(key)
              )

          )

        )

    );

    self.clients.claim();

  }
);


self.addEventListener(
  'fetch',
  event => {

    const request =
      event.request;


    // Never cache API requests.
    if (
      request.method !== 'GET' ||
      request.url.includes(
        'script.google.com'
      )
    ) {

      return;

    }


    event.respondWith(

      fetch(request)
        .then(response => {

          const copy =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {

              cache.put(
                request,
                copy
              );

            });

          return response;

        })
        .catch(() =>

          caches.match(
            request
          )

        )

    );

  }
);
