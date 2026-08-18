/* Memory-only client for the BTC API. The refresh credential remains HttpOnly. */
(function () {
  var token = null;
  var refreshing = null;

  function errorFrom(response, body) {
    var error = new Error((body && body.error) || ('Request failed: ' + response.status));
    error.status = response.status;
    error.body = body;
    return error;
  }

  function request(method, path, body, retried) {
    var headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = 'Bearer ' + token;

    return fetch('/api/v1' + path, {
      method: method,
      headers: headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (response) {
      return response.text().then(function (text) {
        var result = text ? JSON.parse(text) : {};
        if (response.ok) return result;
        if (response.status === 401 && !retried && path !== '/auth/refresh') {
          return refresh().then(function () { return request(method, path, body, true); });
        }
        throw errorFrom(response, result);
      });
    });
  }

  function refresh() {
    if (refreshing) return refreshing;
    refreshing = request('POST', '/auth/refresh', undefined, true)
      .then(function (result) {
        token = result.token || null;
        return result;
      })
      .catch(function (error) {
        token = null;
        throw error;
      })
      .finally(function () { refreshing = null; });
    return refreshing;
  }

  window.LuminaraBtcApi = Object.freeze({
    bootstrap: refresh,
    me: function () { return request('GET', '/me'); },
    progress: function () { return request('GET', '/progress'); },
    visit: function (topic, index) {
      return request('POST', '/progress/visit', { topic: topic, scene_idx: index });
    },
    complete: function (topic, index, key, total) {
      return request('POST', '/progress', {
        topic: topic,
        scene_idx: index,
        completed: index >= total - 1,
        scene_key: key,
        total_scenes: total
      });
    },
    quiz: function (topic) { return request('GET', '/quiz?topic=' + encodeURIComponent(topic)); },
    answer: function (question, option) {
      return request('POST', '/quiz/answer', { question_id: question, option_id: option });
    },
    insights: function () { return request('GET', '/insights/mine'); },
    saveInsight: function (topic, body) {
      return request('POST', '/insights', { topic: topic, body: body });
    }
  });
}());
