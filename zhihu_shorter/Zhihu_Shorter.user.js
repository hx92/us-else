// ==UserScript==
// @name        ZhiHu Shorter
// @name:zh-cn  知乎短答案
// @description 我讨厌长篇大论
// @namespace   https://github.com/tiansh
// @include     *://www.zhihu.com/*
// @updateURL   https://tiansh.github.io/us-else/zhihu_shorter/Zhihu_Shorter.meta.js
// @downloadURL https://tiansh.github.io/us-else/zhihu_shorter/Zhihu_Shorter.user.js
// @homepageURL https://tiansh.github.io/us-else/zhihu_shorter/
// @supportURL  https://github.com/tiansh/us-else/issues/
// @version     2.1
// @copyright   田生; Copyright (c) All Rights Reserved
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @connect-src www.zhihu.com
// ==/UserScript==

/**!
 * 本脚本欢迎任何人以任意方式分发，但不得改作后散播。
 *
 * 建议未登录用户安装“知乎免登录”脚本以获得更好的效果。
 */

var maxCount = 500;

// 检查是否已经登录
var isLogin = function () {
  return !document.querySelector('.js-signin-noauth');
};

// 对象转请求参数
var param = function (data) {
  return Object.keys(data).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
  }).join('&');
};

// 显示更多回答
var showMoreWOLoginBase = (function () {
  // 显示一条回答
  var show = function (ans) {
    var lastAnswer = document.querySelectorAll('.zm-item-answer');
    lastAnswer = lastAnswer[lastAnswer.length - 1];
    var ref = lastAnswer.nextSibling;
    var newAnswerWrap = document.createElement('div');
    newAnswerWrap.innerHTML = ans;
    var newAnswer = newAnswerWrap.firstChild;
    ref.parentNode.insertBefore(newAnswer, ref);
  };

  // 已经没有更多的回答了
  var nomore = function () {
    var button = document.querySelector('.zu-button-more');
    button.parentNode.removeChild(button);
  };

  // 处理显示更多回答的按钮
  return function showMoreButton() {
    var button = document.querySelector('.zu-button-more[aria-role="button"]');
    if (button.classList.contains('loading')) return;
    button.classList.add('loading');

    var offset = document.querySelectorAll('.zm-item-answer').length;
    var pagesize = 20;
    var url_token = Number(location.pathname.match(/\/(\d+)$/)[1]);
    var params = JSON.stringify({
      'url_token': url_token,
      'pagesize': pagesize,
      'offset': offset,
    });

    var _xsrf = document.querySelector('input[name="_xsrf"]').value;

    var data = {
      '_xsrf': _xsrf,
      'method': 'next',
      'params': params
    };

    GM_xmlhttpRequest({
      'method': 'POST',
      'url': location.protocol + '//www.zhihu.com/node/QuestionAnswerListV2',
      'headers': {
        'Referer': location.href,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      'data': param(data),
      'onload': function (response) {
        var resp = JSON.parse(response.responseText);
        resp.msg.forEach(show);
        if (resp.msg.length < 20) nomore();
        button.classList.remove('loading');
      },
      'onerror': function () {
        button.classList.remove('loading');
      }
    });
  };
}());

// 显示更多回答
var showMoreWOLogin = function () {
  if (document.querySelectorAll('.zm-item-answer').length > maxCount) return;
  var more = document.querySelector('.zu-button-more[aria-role="button"]');
  if (more && !more.classList.contains('loading')) setTimeout(function () { showMoreWOLoginBase(); }, 0);
  setTimeout(showMoreWOLogin, 20);
};

// 显示更多回答
var showMoreWLogin = function () {
  if (document.querySelectorAll('.zm-item-answer').length > maxCount) return;
  var more = document.querySelector('.zu-button-more[aria-role="button"]');
  if (more && !more.classList.contains('loading')) setTimeout(function () { more.click(); }, 0);
  setTimeout(showMoreWLogin, 20);
};

var showCollasped = function () {
  var ex = document.querySelector('#zh-question-collapsed-switcher[name="expand"]');
  ex.click();
}

var countWords = function countWords() {
  var answers = document.querySelectorAll('.zm-item-answer:not([data-wordcount])');
  for (var i = 0, l = answers.length; i < l; i++) {
    var text = String(answers[i].querySelector('.zm-editable-content').textContent);
    var wc = text.length - Math.floor((text.match(/[\u32-\u127]/g) || '').length / 2);
    answers[i].setAttribute('data-wordcount', wc);
    answers[i].style.order = wc;
  }
};

(function () {
  if (isLogin()) showMoreWLogin(); else showMoreWOLogin();
  countWords();
  var observer = new MutationObserver(countWords);
  observer.observe(document.body, { 'childList': true, 'subtree': true });
}());

GM_addStyle([
  ' #zh-question-answer-wrap { display: flex; flex-direction: column; } #zh-question-answer-wrap .zm-item-answer { order: 9999999; } ',
  '#zh-answers-filter { display: none; }',
].join(''));

