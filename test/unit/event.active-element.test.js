define([
  'intern!object',
  'intern/chai!expect',
  '../helper/fixtures/custom.fixture',
  'ally/event/active-element',
], function(registerSuite, expect, customFixture, eventActiveElement) {

  registerSuite(function() {
    var fixture;
    var events;
    var handleEvent;
    var collectActiveEvents = function(event) {
      events.push(events.detail);
      handleEvent && handleEvent(event);
    };

    return {
      name: 'event/active-element',

      beforeEach: function() {
        fixture = customFixture([
          '<input type="text" id="first">',
          '<input type="text" id="second">',
        ].join(''));
        events = [];
        document.addEventListener('active-element', collectActiveEvents, true);
      },
      afterEach: function() {
        document.removeEventListener('active-element', collectActiveEvents, true);
        fixture.remove();
        fixture = null;
        events = null;
      },

      lifecycle: function() {
        var deferred = this.async(1000);
        var handle = eventActiveElement();
        var first = document.getElementById('first');
        var second = document.getElementById('second');
        var waitForFirst;
        var waitForSecond;
        var waitForDone;

        expect(handle.disengage).to.be.a('function');
        expect(events.length).to.equal(0);

        // body -> #first
        waitForFirst = function() {
          handleEvent = deferred.rejectOnError(function(event) {
            expect(event.detail.blur).to.equal(document.body);
            expect(event.detail.focus).to.equal(first);
            expect(events.length).to.equal(1);

            waitForSecond();
          });

          setTimeout(function() {
            first.focus();
          });
        };

        // #first -> #second
        waitForSecond = function() {
          handleEvent = deferred.rejectOnError(function(event) {
            expect(event.detail.blur).to.equal(first);
            expect(event.detail.focus).to.equal(second);
            expect(events.length).to.equal(2);

            waitForDone();
          });

          setTimeout(function() {
            second.focus();
          });
        };

        // disengage -> body
        waitForDone = function() {
          // make sure no events are collected after disengaging the event emitter
          handleEvent = deferred.rejectOnError(function() {
            throw new Error('event handler not disengaged');
          });

          handle.disengage();
          setTimeout(function() {
            document.activeElement.blur();
            setTimeout(deferred.rejectOnError(function() {
              expect(events.length).to.equal(2);
              deferred.resolve();
            }), 20);
          });
        };

        waitForFirst();
      },
    };
  });
});