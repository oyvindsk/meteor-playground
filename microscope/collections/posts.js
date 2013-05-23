
Posts = new Meteor.Collection('posts');

Posts.allow({
    update : ownsDocument,
    remove : ownsDocument
});

Posts.deny({
    update : function (userId, post, fieldNames) {
        // may only edit the two following fields
        return ( _.without(fieldNames, 'url', 'title' ).length > 0 );
    }
});


Meteor.methods({
    post    : function (postAttributes) {
        var user = Meteor.user(),
            postWithSameLink = Posts.findOne( {url: postAttributes.url} );

        // ensure that the user is logged in
        if (!user)
            throw new Meteor.Error(401, "You need to log in to post!");

        // and that there's a title
        if (!postAttributes.title)
            throw new Meteor.Error(422, "Pleasae fill inn the headline");

        // check that this url haven't been submitted already
        if (postAttributes.url && postWithSameLink)
            throw new Meteor.Error(302, 'This link was already posted', postWithSameLink._id );

        var post = _.extend( _.pick(postAttributes, 'url', 'message' ), {
            title       : postAttributes.title + (this.isSimulation ? ' (client)' : ' (server)'),
            userId      : user._id,
            author      : user.username,
            submitted   : new Date().getTime()
        });

        // wait for 5 sec
        if ( !this.isSimulation) {
            var Future = Npm.require('fibers/future');
            var future = new Future();
            Meteor.setTimeout( function(){
                future.ret();
            }, 5 * 1000);
            future.wait();
        }

        //console.log( 'Inserting post:', post);

        var postId = Posts.insert(post);

        return postId;
    }
});

