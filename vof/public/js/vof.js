/* Javascript for VoFXBlock. */
function VoFXBlock(runtime, element, settings) {

    var $ = window.jQuery;
    var $element = $(element);
    var buttonCheck = $element.find('.check');
    var buttonVerRespuesta = $element.find('.ver_respuesta');
    var botonesVoF = $element.find('.opcion');
    var lasRespuestas = $element.find('.lasrespuestas');
    var subFeedback = $element.find('.submission-feedback');
    var statusDiv = $element.find('.status');
    
    // Add variables for state caching
    var $xblocksContainer = $('#seq_content');
    var xblockId = settings.location;
    var cachedResponsesId = xblockId + '_vof_responses';
    var cachedIndicatorClassId = xblockId + '_vof_indicator_class';
    var cachedScoreId = xblockId + '_vof_score';
    var cachedAttemptsId = xblockId + '_vof_attempts';
    var cachedMaxAttemptsId = xblockId + '_vof_max_attempts';
    var cachedShowCorrectnessId = xblockId + '_vof_show_correctness';
    var cachedShowAnswerId = xblockId + '_vof_show_answers';
    var cachedLastSubmissionTimeId = xblockId + '_vof_last_submission_time';
    var cachedStateId = xblockId + '_vof_state';
    
    function updateText(result) {
        console.log('VOF updateText:', result);
        
        // Cache state for page navigation
        $xblocksContainer.data(cachedIndicatorClassId, result.indicator_class);
        $xblocksContainer.data(cachedScoreId, result.score);
        $xblocksContainer.data(cachedAttemptsId, result.intentos);
        $xblocksContainer.data(cachedMaxAttemptsId, result.nro_de_intentos);
        $xblocksContainer.data(cachedShowCorrectnessId, result.show_correctness);
        $xblocksContainer.data(cachedShowAnswerId, result.show_answers);
        $xblocksContainer.data(cachedLastSubmissionTimeId, result.last_submission_time);
        
        // Save state of selected answers
        var selectedResponses = {};
        $element.find('.radiovof:checked').each(function() {
            selectedResponses[$(this).attr('pregunta-id')] = $(this).val();
        });
        $xblocksContainer.data(cachedResponsesId, selectedResponses);
        
        // Save complete state object
        $xblocksContainer.data(cachedStateId, {
            indicator_class: result.indicator_class,
            score: result.score,
            intentos: result.intentos,
            nro_de_intentos: result.nro_de_intentos,
            show_correctness: result.show_correctness,
            show_answers: result.show_answers,
            last_submission_time: result.last_submission_time,
            responses: selectedResponses,
            texto: result.texto
        });
        
        //reviso si estoy mostrando correctitud
        if(result.show_correctness != 'never'){
            //actualizo el texto de correcto o incorrecto
            if(result.score >= 1){
                $element.find('.notificacion').html('');
                $element.find('.notificacion').removeClass('lineaarriba');
                $element.find('.notificacion').removeClass('incorrecto');
                $element.find('.notificacion').removeClass('dontshowcorrectness');
                $element.find('.notificacion').removeClass('parcial');
                $element.find('.notificacion').addClass('correcto');
                $element.find('.notificacion.correcto').addClass('lineaarriba');
                $element.find('.notificacion.correcto').html('<img src="'+settings.image_path+'correct-icon.png"/>'+result.texto);
                $element.find('.elticket').html('<img src="'+settings.image_path+'correct-icon.png"/>');
            }
            else{
                $element.find('.notificacion').html('');
                $element.find('.notificacion').removeClass('lineaarriba');
                $element.find('.notificacion').removeClass('correcto');
                $element.find('.notificacion').removeClass('dontshowcorrectness');
                $element.find('.notificacion').removeClass('parcial');
                $element.find('.notificacion').addClass('incorrecto');
                $element.find('.notificacion.incorrecto').addClass('lineaarriba');
                if(result.score > 0){
                    $element.find('.notificacion.incorrecto').addClass('parcial');
                    $element.find('.notificacion.incorrecto').html('<img src="'+settings.image_path+'partial-icon.png"/>'+result.texto);
                    $element.find('.elticket').html('<img src="'+settings.image_path+'partial-icon.png"/>');
                }
                else{
                    $element.find('.notificacion.incorrecto').html('<img src="'+settings.image_path+'incorrect-icon.png"/>'+result.texto);
                    $element.find('.elticket').html('<img src="'+settings.image_path+'incorrect-icon.png"/>');
                }
            }

            statusDiv.removeClass('correct');
            statusDiv.removeClass('incorrect');
            statusDiv.removeClass('unanswered');
            statusDiv.addClass(result.indicator_class);
        }
        else{
            statusDiv.removeClass('correct');
            statusDiv.removeClass('incorrect');
            statusDiv.removeClass('unanswered');
            //no deberia pasar pero por si las moscas
            if(result.indicator_class == 'unanswered')
                statusDiv.addClass('unanswered');
            $element.find('.notificacion').html('');
            $element.find('.notificacion').removeClass('lineaarriba');
            $element.find('.notificacion').removeClass('correcto');
            $element.find('.notificacion').removeClass('incorrecto');
            $element.find('.notificacion').removeClass('parcial');
            $element.find('.notificacion').addClass('dontshowcorrectness');
            $element.find('.notificacion.dontshowcorrectness').addClass('lineaarriba');
            $element.find('.notificacion.dontshowcorrectness').html('<span class="icon fa fa-info-circle" aria-hidden="true"></span>Respuesta enviada.');
            $element.find('.elticket').html();
        }

        //desactivo el boton si es que se supero el nro de intentos
        var finalice = false;
        if(result.nro_de_intentos > 0){
            if(result.nro_de_intentos == 1){
                subFeedback.text('Ha realizado '+result.intentos+' de '+result.nro_de_intentos+' intento');
            }
            else{
                subFeedback.text('Ha realizado '+result.intentos+' de '+result.nro_de_intentos+' intentos');
            }

            if(result.intentos >= result.nro_de_intentos){
                buttonCheck.attr("disabled", true);
                $element.find('.tablagrande').addClass('noclick');
                finalice = true;
            }
            else{
                buttonCheck.attr("disabled", false);
                $element.find('.tablagrande').removeClass('noclick');
            }
        }
        else{
            buttonCheck.attr("disabled", false);
            $element.find('.tablagrande').removeClass('noclick');
        }

        if(finalice || (result.intentos >0 && result.nro_de_intentos <= 0)){
            if(result.show_answers == 'Finalizado' && !$element.find('.ver_respuesta').length && result.show_correctness != 'never'){
                var mostrar_resp = '<button class="ver_respuesta" data-checking="Cargando..." data-value="Ver Respuesta">'
                                    + '<span class="icon fa fa-info-circle" aria-hidden="true"></span></br>'
                                    + '<span>Mostrar<br/>Respuesta</span>'
                                    + '</button>';
                $element.find('.action').append(mostrar_resp);
            }
            clickVerRespuesta();
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

    // Initialization: Check for cached state and restore if found
    $(function ($) {
        console.log("VOF XBlock initializing:", xblockId);
        
        // Check if we have cached state
        if ($xblocksContainer.data(cachedStateId)) {
            console.log("Found cached state for VOF XBlock:", xblockId);
            var state = $xblocksContainer.data(cachedStateId);
            console.log("Cached state:", state);
            
            // Restore visual state based on cached data
            statusDiv.removeClass('correct incorrect unanswered');
            statusDiv.addClass(state.indicator_class);
            
            // Restore selected answers
            if (state.responses) {
                $.each(state.responses, function(questionId, response) {
                    if (response === 'verdadero') {
                        $element.find('.opcV' + questionId).addClass('selv');
                        $element.find('.opcF' + questionId).removeClass('self');
                        $element.find('input[pregunta-id="' + questionId + '"][value="verdadero"]').prop('checked', true);
                    } else if (response === 'falso') {
                        $element.find('.opcF' + questionId).addClass('self');
                        $element.find('.opcV' + questionId).removeClass('selv');
                        $element.find('input[pregunta-id="' + questionId + '"][value="falso"]').prop('checked', true);
                    }
                });
            }
            
            // Restore submission feedback
            if (state.nro_de_intentos > 0) {
                if (state.nro_de_intentos == 1) {
                    subFeedback.text('Ha realizado ' + state.intentos + ' de ' + state.nro_de_intentos + ' intento');
                } else {
                    subFeedback.text('Ha realizado ' + state.intentos + ' de ' + state.nro_de_intentos + ' intentos');
                }
            }
            
            // Restore button state
            if (state.intentos >= state.nro_de_intentos && state.nro_de_intentos > 0) {
                buttonCheck.attr("disabled", true);
                $element.find('.tablagrande').addClass('noclick');
                
                // Show "Ver Respuesta" button if needed
                if (state.show_answers == 'Finalizado' && !$element.find('.ver_respuesta').length && state.show_correctness != 'never') {
                    var mostrar_resp = '<button class="ver_respuesta" data-checking="Cargando..." data-value="Ver Respuesta">'
                                    + '<span class="icon fa fa-info-circle" aria-hidden="true"></span></br>'
                                    + '<span>Mostrar<br/>Respuesta</span>'
                                    + '</button>';
                    $element.find('.action').append(mostrar_resp);
                    clickVerRespuesta();
                }
            }
            
            // Restore notification area based on score and show_correctness
            if (state.show_correctness != 'never') {
                if (state.score >= 1) {
                    $element.find('.notificacion').html('');
                    $element.find('.notificacion').removeClass('lineaarriba incorrecto dontshowcorrectness parcial');
                    $element.find('.notificacion').addClass('correcto lineaarriba');
                    $element.find('.notificacion.correcto').html('<img src="' + settings.image_path + 'correct-icon.png"/>' + state.texto);
                    $element.find('.elticket').html('<img src="' + settings.image_path + 'correct-icon.png"/>');
                } else if (state.score > 0) {
                    $element.find('.notificacion').html('');
                    $element.find('.notificacion').removeClass('lineaarriba correcto dontshowcorrectness');
                    $element.find('.notificacion').addClass('incorrecto lineaarriba parcial');
                    $element.find('.notificacion.incorrecto').html('<img src="' + settings.image_path + 'partial-icon.png"/>' + state.texto);
                    $element.find('.elticket').html('<img src="' + settings.image_path + 'partial-icon.png"/>');
                } else if (state.intentos > 0) {
                    $element.find('.notificacion').html('');
                    $element.find('.notificacion').removeClass('lineaarriba correcto dontshowcorrectness parcial');
                    $element.find('.notificacion').addClass('incorrecto lineaarriba');
                    $element.find('.notificacion.incorrecto').html('<img src="' + settings.image_path + 'incorrect-icon.png"/>' + state.texto);
                    $element.find('.elticket').html('<img src="' + settings.image_path + 'incorrect-icon.png"/>');
                }
            } else if (state.intentos > 0) {
                $element.find('.notificacion').html('');
                $element.find('.notificacion').removeClass('lineaarriba correcto incorrecto parcial');
                $element.find('.notificacion').addClass('dontshowcorrectness lineaarriba');
                $element.find('.notificacion.dontshowcorrectness').html('<span class="icon fa fa-info-circle" aria-hidden="true"></span>Respuesta enviada.');
            }
        } else {
            console.log("No cached state found for VOF XBlock:", xblockId);
        }
        
        var vofid = "vof_" + settings.location;
        renderMathForSpecificElements(vofid);
    });

    botonesVoF.click(function(eventObject) {
        if(statusDiv.hasClass("unanswered") && !settings.is_past_due){
            buttonCheck.attr("disabled", false);
        }
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
        if ($.isFunction(runtime.notify)) {
            runtime.notify('submit', {
                message: 'Submitting...',
                state: 'start'
            });
        }
        var resp,resps = [];
        $element.find('.radiovof:checked').each(function() { // run through each of the checkboxes
            resp = {
              name: $(this).attr('pregunta-id'),
              value: $(this).val()
            };
            resps.push(resp);
          });
          
        console.log('Submitting answers for VOF XBlock:', xblockId, resps);
        
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify({"respuestas": resps}),
            success: updateText
        });
        if ($.isFunction(runtime.notify)) {
            runtime.notify('submit', {
                state: 'end'
            });
        }
    });

    function clickVerRespuesta(){
        buttonVerRespuesta = $element.find('.ver_respuesta');
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
    }
    clickVerRespuesta();

    //console.log(lasRespuestas);
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

    function renderMathForSpecificElements(id) {
        //console.log("Render mathjax in " + id)
        if (typeof MathJax !== "undefined") {
            var $vof = $('#' + id);
            if ($vof.length) {
                $vof.find('.dtcell1, .dtcell2, .dtcell3, .dtcell4').each(function (index, vofelem) {
                    //console.log("encontrado "+ vofelem )
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, vofelem]);
                });
            }
        } else {
            console.warn("MathJax no está cargado.");
        }
    }
}