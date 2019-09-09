#!/usr/bin/env python
# -*- coding: utf-8 -*- 
"""Bloque verdadero o falso"""

import pkg_resources


from xblock.core import XBlock
from django.db import IntegrityError
from django.template.context import Context
from xblock.fields import Integer, String, Dict, Scope, Float, Boolean
from xblockutils.resources import ResourceLoader
from xblock.fragment import Fragment

loader = ResourceLoader(__name__)

@XBlock.needs('i18n')
class VoFXBlock(XBlock):
    """
    TO-DO: XBlock que genera una tabla con preguntas V o F, se considera correcto sólo si se contestó el 100% bien
    """

        # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    #campos de los settings
    display_name = String(
        display_name="Display Name",
        help="Nombre del componente",
        scope=Scope.settings,
        default="Verdadero o Falso"
    )

    texto_verdadero = String(
        display_name="Verdadero",
        help="Texto que ve el estudiante en el Verdadero",
        scope=Scope.settings,
        default="V"
    )

    texto_falso = String(
        display_name="Falso",
        help="Texto que ve el estudiante en el Falso",
        scope=Scope.settings,
        default="F"
    )

    texto_correcto = String(
        display_name="Falso",
        help="Texto que aparece al tener todas buenas",
        scope=Scope.settings,
        default=unicode("¡Respuesta Correcta!","utf8"),
    )

    texto_incorrecto = String(
        display_name="Falso",
        help="Texto que aparece cuando tienes al menos una mala",
        scope=Scope.settings,
        default=unicode("Respuesta Incorrecta","utf8")
    )

    #preguntas
    preguntas = Dict(default={'1':{'enunciado':'¿1+1=2?', 'valor': True}, '2':{'enunciado':'Un triángulo tiene 4 lados', 'valor':False}},
                 scope=Scope.settings,
                 help="Lista de preguntas del V o F")
    #respuestas del estudiante
    #WARNING: por algún motivo dejar esto default vacio dio problemas
    respuestas = Dict(default={'1':'nada','2':'nada'},
                 scope=Scope.user_state,
                 help="Aquí guardaré las respuestas de los estudiantes")
    #si respondió o no
    respondido = Boolean(help="Respondió?", default=False,
        scope=Scope.user_state)
    
    score = Float(
        default=0.0,
        scope=Scope.user_state,
    )

    weight = Integer(
        display_name='Weight',
        help='Entero que representa el peso del problema',
        default=1,
        values={'min': 1},
        scope=Scope.settings,
    )

    max_attempts = Integer(
        display_name='Nro. de Intentos',
        help='Entero que representa cuantas veces se puede responder problema',
        default=2,
        values={'min': 1},
        scope=Scope.settings,
    )

    intentos = Integer(
        display_name='Intentos',
        help='Cuantas veces el estudiante ha intentado responder',
        default=0,
        values={'min': 0},
        scope=Scope.user_state,
    )

    has_score = True

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")
    
    def build_fragment(
            self,
            rendered_template,
            initialize_js_func,
            additional_css=[],
            additional_js=[],
    ):
        #  pylint: disable=dangerous-default-value, too-many-arguments
        """
        Creates a fragment for display.
        """
        fragment = Fragment(rendered_template)
        for item in additional_css:
            url = self.runtime.local_resource_url(self, item)
            fragment.add_css_url(url)
        for item in additional_js:
            url = self.runtime.local_resource_url(self, item)
            fragment.add_javascript_url(url)
        fragment.initialize_js(initialize_js_func)
        return fragment

    def student_view(self, context={}):
        """
        Vista estudiante
        """
        #Tuve que pasar las preguntas a una lista para ordenarlas, TO DO: pasar a listas o ver que es mas eficiente
        lista_pregs = [ [k,v] for k, v in self.preguntas.items() ]
        lista_pregs = sorted(lista_pregs, key=lambda x: int(x[0]))

        texto_intentos = ''
        no_mas_intentos = False

        if self.max_attempts > 0:
            texto_intentos = "Has realizado "+str(self.intentos)+" de "+str(self.max_attempts)+" intentos"
            if self.intentos >= self.max_attempts:
                no_mas_intentos = True

        #status respuesta
        indicator_class = self.get_indicator_class()

        context.update(
            {
                'display_name': self.display_name,
                'preguntas': lista_pregs,
                'respuestas': self.respuestas,
                'texto_verdadero': self.texto_verdadero,
                'texto_falso': self.texto_falso,
                'texto_correcto': self.texto_correcto,
                'texto_incorrecto': self.texto_incorrecto,
                'texto_intentos': texto_intentos,
                'no_mas_intentos': no_mas_intentos,
                'score': self.score,
                'respondido': self.respondido,
                'indicator_class': indicator_class,
                'location': unicode(self.location).split('@')[-1]
            }
        )
        template = loader.render_django_template(
            'public/html/vof.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='VoFXBlock',
            additional_css=[
                'public/css/vof.css',
            ],
            additional_js=[
                'public/js/vof.js',
            ],
        )
        return frag

    def studio_view(self, context):
        """
        Create a fragment used to display the edit view in the Studio.
        """
        #Tuve que pasar las preguntas a una lista para ordenarlas
        lista_pregs = [ [k,v] for k, v in self.preguntas.items() ]
        lista_pregs = sorted(lista_pregs, key=lambda x: int(x[0]))

        context.update(
            {
                'display_name': self.display_name,
                'preguntas': lista_pregs,
                'location': self.location,
                'texto_verdadero': self.texto_verdadero,
                'texto_falso': self.texto_falso,
                'weight': self.weight,
                'nro_de_intentos': self.max_attempts
            }
        )
        template = loader.render_django_template(
            'public/html/vof_studio.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='VoFEditBlock',
            additional_js=[
                'public/js/vof_studio.js',
            ],
        )    
        return frag

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.
        # handler para votar sí o no
    @XBlock.json_handler
    def responder(self, data, suffix=''):  # pylint: disable=unused-argument
        """
        Responder el V o F
        """
        nuevas_resps = {}
        texto = self.texto_correcto
        buenas = 0.0
        malas = 0.0
        total = len(self.preguntas)
        for e in data['respuestas']:
            #WARNING: No sé por qué esto llega como string y se guarda como string en el studio_submit
            idpreg = e['name']
            print(idpreg)
            print(self.preguntas[idpreg])
            miresp = ''
            if e['value'] == 'verdadero':
                miresp = True
                nuevas_resps[idpreg] = 'verdadero'
            elif e['value'] == 'falso':
                miresp = False
                nuevas_resps[idpreg] = 'falso'
            if miresp != self.preguntas[idpreg]['valor']:
                texto = self.texto_incorrecto
                malas+=1
            else:
                buenas+=1
            
        malas = (total-buenas)
        if malas > 0:
            texto = self.texto_incorrecto

        #si no llego nada no lo actualizo
        if nuevas_resps:
            self.respuestas = nuevas_resps

        #puntaje - falta peso
        self.score = float(buenas/(malas+buenas))
        try:
            self.runtime.publish(
                self,
                'grade',
                {
                    'value': self.score,
                    'max_value': 1
                }
            )
            self.intentos += 1
        except IntegrityError:
            pass

        #ya respondi
        self.respondido = True

        #status respuesta
        indicator_class = self.get_indicator_class()

        return {'texto':texto,'score':self.score, 'nro_de_intentos': self.max_attempts, 'intentos': self.intentos, 'indicator_class':indicator_class}
    
    @XBlock.json_handler
    def mostrar_respuesta(self, data, suffix=''):
        """
        Mostrar las respuestas
        """
        return {'preguntas': self.preguntas}


    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        nuevas_pregs = {}
        pregs = data.get('preguntas')
        for p in pregs:
            valor = True
            if p['valor'] == 'F':
                valor = False
            #WARNING: Aquí aunque castee a int, queda como string la id, me rendi por eso ocupo string
            nuevas_pregs[p['id']] = {'enunciado':p['enunciado'], 'valor': valor}

        self.display_name = data.get('display_name')
        self.texto_verdadero = data.get('texto_verdadero')
        self.texto_falso = data.get('texto_falso')
        if data.get('weight') > 0:
            self.weight = data.get('weight')
        if data.get('nro_de_intentos') > 0:
            self.max_attempts = data.get('nro_de_intentos')
        self.preguntas = nuevas_pregs
    
        return {'result': 'success'}

    def get_indicator_class(self):
        indicator_class = 'unanswered'
        if self.respondido and self.intentos:
            if self.score >= 1:
                indicator_class = 'correct'
            else:
                indicator_class = 'incorrect'
        return indicator_class

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("VoFXBlock",
             """<vof/>
             """),
            ("Multiple VoFXBlock",
             """<vertical_demo>
                <vof/>
                <vof/>
                <vof/>
                </vertical_demo>
             """),
        ]
