/* Javascript for VoFXBlock. */
function VoFXBlock(runtime, element) {

    var $ = window.jQuery;
    var $element = $(element);
    var buttonCheck = $element.find('.check');
    var buttonVerRespuesta = $element.find('.ver_respuesta');
    var botonesVoF = $element.find('.opcion');
    var lasRespuestas = $element.find('.lasrespuestas');
    var subFeedback = $element.find('.submission-feedback');
    var statusDiv = $element.find('.status');

    function updateText(result) {
    //actualizo el texto de correcto o incorrecto y desactivo el boton si es que se supero el nro de intentos
        if(result.score >= 1){
            $element.find('.notificacion').html('');
            $element.find('.notificacion').removeClass('lineaarriba');
            $element.find('.notificacion').removeClass('incorrecto');
            $element.find('.notificacion').addClass('correcto');
            $element.find('.notificacion.correcto').addClass('lineaarriba');
            $element.find('.notificacion.correcto').html('<img src="https://static.sumaysigue.uchile.cl/cmmeduformacion/produccion/assets/img/correct-icon.png"/>'+result.texto);
            $element.find('.elticket').html('<img src="https://static.sumaysigue.uchile.cl/cmmeduformacion/produccion/assets/img/correct-icon.png"/>');
        }
        else{
            $element.find('.notificacion').html('');
            $element.find('.notificacion').removeClass('lineaarriba');
            $element.find('.notificacion').removeClass('correcto');
            $element.find('.notificacion').addClass('incorrecto');
            $element.find('.notificacion.incorrecto').addClass('lineaarriba');
            $element.find('.notificacion.incorrecto').html('<img src="https://static.sumaysigue.uchile.cl/cmmeduformacion/produccion/assets/img/incorrect-icon.png"/>'+result.texto);
            $element.find('.elticket').html('<img src="https://static.sumaysigue.uchile.cl/cmmeduformacion/produccion/assets/img/incorrect-icon.png"/>');
        }

        statusDiv.removeClass('correct');
        statusDiv.removeClass('incorrect');
        statusDiv.removeClass('unanswered');
        statusDiv.addClass(result.indicator_class);

        if(result.nro_de_intentos > 0){
            subFeedback.text('Has realizado '+result.intentos+' de '+result.nro_de_intentos+' intentos');
            if(result.intentos >= result.nro_de_intentos){
                buttonCheck.attr("disabled", true);
            }
            else{
                buttonCheck.attr("disabled", false);
            }
        }
        else{
            buttonCheck.attr("disabled", false);
        }
        buttonCheck.html("<span>" + buttonCheck[0].dataset.value + "</span>");
    }

    function showAnswers(result){
        $.each( result.preguntas, function( key, value ) {
            if(value.valor){
                $element.find('.opcV'+key).addClass('cuadroverde');
            }
            else{
                $element.find('.opcF'+key).addClass('cuadroverde');
            }
          });
    }

    var handlerUrl = runtime.handlerUrl(element, 'responder');
    var handlerUrlVerResp = runtime.handlerUrl(element, 'mostrar_respuesta');

    botonesVoF.click(function(eventObject) {
        console.log("click");
        eventObject.preventDefault();
        var pid = $(this).children("input[type=radio]").attr('pregunta-id');
        $(this).children("input[type=radio]").prop('checked', true);
        if($(this).hasClass('opcV')){
            $(this).addClass('selv');
            $element.find('.opcF'+pid).removeClass('self');
        }
        else{
            $(this).addClass('self');
            $element.find('.opcV'+pid).removeClass('selv');
        }
    });

    buttonCheck.click(function(eventObject) {
        eventObject.preventDefault();
        buttonCheck.html("<span>" + buttonCheck[0].dataset.checking + "</span>");
        buttonCheck.attr("disabled", true);
        var resp,resps = [];
        $element.find('.radiovof:checked').each(function() { // run through each of the checkboxes
            resp = {
              name: $(this).attr('pregunta-id'),
              value: $(this).val()
            };
            resps.push(resp);
          });
          console.log(resps);
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify({"respuestas": resps}),
            success: updateText
        });
    });

    buttonVerRespuesta.click(function(eventObject) {
        eventObject.preventDefault();
        buttonVerRespuesta.attr("disabled", true);
        $.ajax({
            type: "POST",
            url: handlerUrlVerResp,
            data: JSON.stringify({}),
            success: showAnswers
        });
    });

    console.log(lasRespuestas);
    lasRespuestas.each(function() {
        if($( this ).val() == 'verdadero'){
            var pid = $( this ).attr('respuesta-id');
            $element.find('.opcV'+pid).click();
        }
        else{
            var pid = $( this ).attr('respuesta-id');
            $element.find('.opcF'+pid).click();
        }
      });

    $(function ($) {
        /* Here's where you'd do things on page load. */
    });
}
