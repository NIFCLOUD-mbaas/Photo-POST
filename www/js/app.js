// [NCMB] APIキー設定
var appKey    = "YOUR_NCMB_APPLICATION_KEY";
var clientKey = "YOUR_NCMB_CLIENT_KEY";

// [NCMB] SDKの初期化
var ncmb = new NCMB(appKey, clientKey);

// [NCMB] カレントユーザー
var currentUser;

// img flag
var imgFlag = false;

/********** [NCMB] 会員管理（ユーザー名 / PW 認証） **********/
// 「登録する」ボタン押下時の処理
function onIDRegisterBtn() {
    // 入力フォームからユーザー名 / PWを取得
    var userName = $("#registUserName").val();
    var password = $("#registPassword").val();
    // loading の表示
    $.mobile.loading('show');
    // [NCMB] user インスタンスの生成
    var user = new ncmb.User();
    // [NCMB] ユーザー名 / PWで新規登録
    user.set("userName", userName)
          .set("password", password)
          .signUpByAccount()
          .then(function(user) {
              /* 処理成功 */
              console.log("新規登録に成功しました");
              // [NCMB] userインスタンスでログイン
              ncmb.User.login(user)
                      .then(function(user) {
                          /* 処理成功 */
                          console.log("ログインに成功しました");
                          // カレントユーザーの取得
                          currentUser = ncmb.User.getCurrentUser();
                          // フィールドを空に
                          onDeleteRegistPageField();
                          // 詳細ページへ移動
                          $.mobile.changePage('#HomeScreenPage');
                      })
                      .catch(function(error) {
                          /* 処理失敗 */
                          console.log("ログインに失敗しました: " + error);
                          alert("ログインに失敗しました: " + error);
                          // フィールドを空に
                          onDeleteRegistPageField();
                          // loading の表示
                          $.mobile.loading('hide');
                      });
          })
          .catch(function(error) {
              /* 処理失敗 */
              console.log("新規登録に失敗しました：" + error);
              alert("新規登録に失敗しました：" + error);
              // フィールドを空に
              onDeleteRegistPageField();
              // loading の表示
              $.mobile.loading('hide');
          });
}

// 「ログインする」ボタン押下時の処理
function onLoginBtn() {
    // 入力フォームからユーザー名 / PWを取得
    var username = $("#loginUserName").val();
    var password = $("#loginPassword").val();
    // loading の表示
    $.mobile.loading('show');
    
    // [NCMB] ユーザー名 / PWでログイン
    ncmb.User.login(username, password)
                   .then(function(user) {
                       /* 処理成功 */
                       console.log("ログインに成功しました");
                       // カレントユーザーの取得
                      currentUser = ncmb.User.getCurrentUser();
                       // フィールドを空に
                       onDeleteLoginPageField();
                       // 詳細ページへ移動
                       $.mobile.changePage('#HomeScreenPage');
                   })
                   .catch(function(error) {
                       /* 処理失敗 */
                       console.log("ログインに失敗しました: " + error);
                       alert("ログインに失敗しました: " + error);
                       // フィールドを空に
                       onDeleteLoginPageField();
                       // loading の表示終了
                       $.mobile.loading('hide');
                   });
}

// 「ログアウト」ボタン押下後確認アラートで「はい」押下時の処理
function onLogoutBtn() {  
    // [NCMB] ログアウト
    ncmb.User.logout();
    console.log("ログアウトに成功しました");
    // ログインページへ移動
    $.mobile.changePage('#LoginPage');
}

/********** [NCMB] ファイルストア（画像のアップロード/ダウンロード） **********/
// 「アップロード」ボタン押下時の処理
function onUploadBtn() {
    // 作品名を取得
    var imgName = $("#imgName").val();
    // 入力チェック
    if (imgName == "") {
        alert("作品名を入力してください");
        return;
    }
    if (imgFlag == false) {
        alert("投稿する写真を選択してください");
        return;
    }

    var img = document.getElementById('photo_image');
    var photoType = $("#photo")[0].files[0].type;
    var base64 = ImageToBase64(img, photoType);
    var photoData = toBlob(base64, photoType);

    // loading の表示
    $.mobile.loading('show', {
        text: 'Sending...',
        textVisible: true,
        theme: 'a',
        textonly: false,
        html: ''
    });

    // uuidを生成
    var uuid = makeUUID();
    // 選択した画像のファイル名を取得
    var fileName = $("#photo")[0].files[0].name;
    var sp = fileName.split('.');
    // 選択した画像の拡張子を取得
    var fileName_type = sp[sp.length-1];
    // 作品名をエンコード
    imgName = encodeURIComponent(imgName);
    // カレントユーザーのユーザー名を取得
    var currentUserName = currentUser.get("userName");
    // 作品の保存名を作成「作品名_作者名_uuid.拡張子」
    var photoName = imgName + "_" + currentUserName + "_" + uuid + "." + fileName_type;

    // 参照権限（ACL）を生成
    var acl = new ncmb.Acl();
    // 全員「読み込み可」、特定のユーザーのみの「書き込み可」で設定
    acl.setPublicReadAccess(true)
        .setUserReadAccess(currentUser, true)
        .setUserWriteAccess(currentUser, true);

    // 写真アップロード
    ncmb.File
            .upload(photoName, photoData, acl)
            .then(function(result){
                // アップロード成功時の処理
                alert("アップロード成功");
                console.log("アップロード成功");
                // フィールドを空に
                onDeleteHomeScreenPageField
                // loading の非表示
                $.mobile.loading('hide');
            })
            .catch(function(error){
                // アップロード失敗時の処理
                alert("アップロード失敗：" + error);
                console.log("アップロード失敗：" + error);
                // loading の非表示
                $.mobile.loading('hide');
            });
}

 // ファイルストアに格納されたファイルデータ（画像本体以外の情報）を取得＜全ての作品＞
function getAllFileData(){
    // フィールドを空に
    onDeleteEveryonePageField();
    // loading の表示
    $.mobile.loading('show', {
        text: 'Loading...',
        textVisible: true,
        theme: 'a',
        textonly: false,
        html: ''
    });

    ncmb.File
            .order("createDate",true) // 作成日の降順を指定
            .limit(10) // 取得件数を10件で指定
            .fetchAll()
            .then(function(results){
                // ファイルデータ取得成功時の処理
                console.log("ファイルデータ取得成功(allFile)");

                var promises = [];
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    // ファイルデータを元にPromiseを使って１件ずつ同期処理でファイルストアから画像を取得
                    promises.push(downloadFile(object, i)); 
                }

                /*** Promise ***/
                Promise.all(promises)
                            .then(function(results) {
                                // 全てのPromise処理成功時の処理
                                 console.log("全てのPromise処理に成功(allFile)：" + results + " OK");
                                // loading の表示を終了
                                $.mobile.loading('hide');
                            })
                            .catch(function(error){
                                // 全てのPromise処理成功時の処理
                                console.log("Promise処理に失敗(allFile)：" + error);
                                alert("Promise処理に失敗(allFile)" );
                                // loading の表示を終了
                                $.mobile.loading('hide');
                            });
            })
            .catch(function(error){
                // ファイルデータ取得失敗時の処理
                console.log("ファイルデータ取得失敗(allFile)：" + error);
                alert("ファイルデータ取得失敗(allFile)" );
                // loading の表示を終了
                $.mobile.loading('hide');
            });
}

// ファイルストアから画像を取得して「みんなの投稿」に表示
function downloadFile(object, i) {
    /*** Promise ***/
    return new Promise(function(resolve, reject) {        
        // 画像・作品名・作者名の表示先を指定
        var imageId = "image_" + i;
        var titleId = "title_" + i;
        var posterId = "poster_" + i;

        // ファイルデータからファイル名を取得
        var fileName = object.fileName;
        var fileName_encode = encodeURI(fileName);

        // ファイルのダウンロード（データ形式をblobを指定）
        ncmb.File.download(fileName_encode, "blob")
                      .then(function(blob) {
                          // ファイルダウンロード成功時の処理
                          var reader = new FileReader();
                          reader.onload = function(e) {
                              // 画像URLを設定
                              var dataUrl = reader.result;
                              document.getElementById(imageId).src = dataUrl;
                              //  ファイル名を分解
                              var fileNameArray = fileName.split('_');
                              // 作品名を表示
                              var imageName = "作品名「" + fileNameArray[0] + "」";
                              document.getElementById(titleId).innerHTML = imageName;
                              // 作者名を表示
                              var posterName = "作者：" + fileNameArray[1] + "さん";
                              document.getElementById(posterId).innerHTML = posterName;
                          }
                          // ファイルリーダーにデータを渡す
                          reader.readAsDataURL(blob);
                          
                          resolve("画像" +i); 
                      })
                      .catch(function(error) {
                          // ファイルダウンロード失敗時の処理
                          reject("画像" + i);
                      });
    });
}

// ファイルストアに格納されたファイルデータ（画像本体以外の情報）を取得＜自分の作品＞
function getMyFileData(){
    // loading の表示
    $.mobile.loading('show', {
        text: 'Loading...',
        textVisible: true,
        theme: 'a',
        textonly: false,
        html: ''
    });
    // フィールドを空に
    onDeleteMyPageField();
    // カレントユーザーの objectId を取得
    var objectId = currentUser.get("objectId");
    // 参照権限（ACL）としてカレントーユーザーにのみ読み書き権限が付与されているデータを指定
    var aclQueryStr = '{"*":{"read":true},"' + objectId + '":{"read":true,"write":true}}';
    aclQuery = JSON.parse(aclQueryStr);

    ncmb.File
            .equalTo("acl", aclQuery) 
            .order("createDate",true) // 作成日の降順を指定
            .limit(10) // 取得件数を10件で指定
            .fetchAll()
            .then(function(results){
                // ファイルデータ取得成功時の処理
                console.log("ファイルデータ取得成功(myFile)");

                var promises = [];
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    // ファイルデータを元にPromiseを使って１件ずつ同期処理でファイルストアから画像を取得
                    promises.push(downloadMyFile(object, i)); 
                }

                /*** Promise ***/
                Promise.all(promises)
                            .then(function(results) {
                                // 全てのPromise処理成功時の処理
                                 console.log("全てのPromise処理に成功(myFile)：" + results + " OK");
                                // loading の表示を終了
                                $.mobile.loading('hide');
                            })
                            .catch(function(error){
                                // 全てのPromise処理成功時の処理
                                console.log("Promise処理に失敗(myFile)：" + error);
                                alert("Promise処理に失敗(myFile)" );
                                // loading の表示を終了
                                $.mobile.loading('hide');
                            });
            })
            .catch(function(error){
                // ファイルデータ取得失敗時の処理
                console.log("ファイルデータ取得失敗(myFile)：" + error);
                alert("Promise処理に失敗(myFile)" );
                // loading の表示を終了
                $.mobile.loading('hide');
            });
}

// ファイルストアから画像を取得して「MY イラスト」に表示
function downloadMyFile(object, i) {
    /*** Promise ***/
    return new Promise(function(resolve, reject) {
        //  画像・作品名の表示先を指定
        var myImageId = "myImage_" + i;
        var myTitleId = "myTitle_" + i;

        // ファイルデータからファイル名を取得
        var fileName = object.fileName;
        var fileName_encode = encodeURI(fileName);

        // ダウンロード（データ形式をblobを指定）
        ncmb.File.download(fileName_encode, "blob")
                      .then(function(blob) {
                          // ファイルダウンロード成功時の処理
                          var reader = new FileReader();
                          reader.onload = function(e) {
                              // 画像URLを設定
                              var dataUrl = reader.result;
                              document.getElementById(myImageId).src = dataUrl;
                              //  ファイル名を分解
                              var fileNameArray = fileName.split('_');
                              // 作品名を表示
                              var imageName = "作品名「" + fileNameArray[0] + "」";
                              document.getElementById(myTitleId).innerHTML = imageName;
                          }
                          // ファイルリーダーにデータを渡す
                          reader.readAsDataURL(blob);                        
                      
                          resolve("画像" + i); 
                      })
                      .catch(function(error) {
                          // ファイルダウンロード失敗時の処理
                          reject("画像" + i);
                      });
    });
};

//---------------------------------------------------------------------------

// アプリ起動時
$(function() {
    $.mobile.defaultPageTransition = 'none';
    $("#loginBtn").click(onLoginBtn);
    $("#registerBtn").click(onIDRegisterBtn);
    $("#YesBtn_logout").click(onLogoutBtn);
    $("#everyoneBtn").click(onEveryoneBtn);
    $("#myFilesBtn").click(onMyFilesBtn);
    $("#uploadBtn").click(onUploadBtn);

    $('form').on('change', 'input[type="file"]', function(e) {
        file = e.target.files[0],
        reader = new FileReader(),
        t = this;

        fileType = file.type.indexOf("image");

        // 画像ファイル以外の場合は何もしない
        if(fileType < 0){
            alert("画像ファイルを選択してください");
            return false;
        }

        // ファイル読み込みが完了した際のイベント登録
        reader.onload = (function(file) {
            imgFlag = true;
            return function(e) {
            //既存のプレビューを削除
            $("#preview").empty();
            // .previewの領域の中にロードした画像を表示するimageタグを追加
            $("#preview").append($('<img id="photo_image">').attr({
                src: e.target.result,
                width: "100%",
                class: "preview",
                title: file.name
            }));
          };
        })(file);

        reader.readAsDataURL(file);
      });
});

// loading 表示生成
$(document).on('mobileinit',function(){
    $.mobile.loader.prototype.options;
});

// HomeScreen ページが表示されるたびに実行される処理
$(document).on('pageshow','#HomeScreenPage', function(e, d) {
    // loading の表示を終了
    $.mobile.loading('hide');
    
});

function onDeleteLoginPageField() {
    // フィールドを空に
    $("#loginUserName").val("");
    $("#loginPassword").val("");
}

function onDeleteRegistPageField() {
    // フィールドを空に
    $("#registUserName").val("");
    $("#registPassword").val("");
}

function onDeleteHomeScreenPageField() {
    // フィールドを空に
    $("#imgName").val("");
    $("#photo").val("");
    $("#preview").empty();
}

function onDeleteEveryonePageField() {
    // フィールドを空に
    $("#image_0").attr("src", "");
    $("#image_1").attr("src", "");
    $("#image_2").attr("src", "");
    $("#image_3").attr("src", "");
    $("#title_0").html("");
    $("#title_1").html("");
    $("#title_2").html("");
    $("#title_3").html("");
    $("#poster_0").html("");
    $("#poster_1").html("");
    $("#poster_2").html("");
    $("#poster_3").html("");
}

function onDeleteMyPageField() {
    // フィールドを空に
    $("#myImage_0").attr("src", "");
    $("#myImage_1").attr("src", "");
    $("#myImage_2").attr("src", "");
    $("#myImage_3").attr("src", "");
    $("#myTitle_0").html("");
    $("#myTitle_1").html("");
    $("#myTitle_2").html("");
    $("#myTitle_3").html("");
}

// 「みんなの投稿」ボタン押下時の処理
function onEveryoneBtn() {  
    // みんなの投稿画面へ遷移
    $.mobile.changePage('#EveryonePage');
    // 画像一覧のダウンロード
    getAllFileData();
}

// 「MY イラスト」ボタン押下時の処理
function onMyFilesBtn(){
    // My イラスト画面へ遷移
    $.mobile.changePage('#MyPage');
    // 画像一覧のダウンロード
    getMyFileData();
}

//===================================
// <img>要素 → Base64形式の文字列に変換
//   img       : HTMLImageElement
//   mime_type : string "image/png", "image/jpeg" など
//===================================
function ImageToBase64(img, mime_type) {
    // New Canvas
    var canvas = document.createElement('canvas');
    canvas.width  = img.width;
    canvas.height = img.height;
    // Draw Image
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    // To Base64
    return canvas.toDataURL(mime_type);
}

function toBlob(base64, mime_type) {
    var bin = atob(base64.replace(/^.*,/, ''));
    var buffer = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
        buffer[i] = bin.charCodeAt(i);
    }
    // Blobを作成
    try{
        var blob = new Blob([buffer.buffer], {
            type: mime_type
        });
    }catch (e){
        return false;
    }
    return blob;
}

// UUID生成
function makeUUID() {
    var d = + new Date();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
}