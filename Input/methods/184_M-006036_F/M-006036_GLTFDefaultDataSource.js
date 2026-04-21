getMetaModel(metaModelSrc, ok, error) {
    utils.loadJSON(metaModelSrc,
        (json) => {
            ok(json);
        },
        function (errMsg) {
            error(errMsg);
        });
}
