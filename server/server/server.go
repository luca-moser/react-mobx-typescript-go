package server

import (
	"fmt"
	"github.com/facebookgo/inject"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/luca-moser/react-mobx-typescript-go/server/controllers"
	"github.com/luca-moser/react-mobx-typescript-go/server/routers"
	"github.com/luca-moser/react-mobx-typescript-go/server/server/config"
	"github.com/luca-moser/react-mobx-typescript-go/server/utilities"
	"gopkg.in/mgo.v2"
	"html/template"
	"io"
	"os"
	"time"
)

type TemplateRendered struct {
	templates *template.Template
}

func (t *TemplateRendered) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

type Server struct {
	Config    *config.Configuration
	WebEngine *echo.Echo
	Mongo     *mgo.Session
}

func (server *Server) Start() {
	start := time.Now().UnixNano()

	// load config
	configuration := config.LoadConfig()
	server.Config = configuration
	appConfig := server.Config.App
	httpConfig := server.Config.Net.HTTP

	// init logger
	utilities.Debug = appConfig.Verbose
	logger, err := utilities.GetLogger("app")
	if err != nil {
		panic(err)
	}
	logger.Info("booting up app...")

	// connect to mongo
	mongo, err := connectMongoDB(server.Config.Net.Database.Mongo)
	if err != nil {
		panic(err)
	}
	if err = mongo.Ping(); err != nil {
		panic(err)
	}
	server.Mongo = mongo
	logger.Info("connection to MongoDB established")

	// init web server
	e := echo.New()
	e.HideBanner = true
	server.WebEngine = e
	if httpConfig.LogRequests {
		requestLogFile, err := os.Create(fmt.Sprintf("./logs/requests.log"))
		if err != nil {
			panic(err)
		}
		e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{Output: requestLogFile}))
		e.Logger.SetLevel(3)
	}

	// load html files
	e.Renderer = &TemplateRendered{
		templates: template.Must(template.ParseGlob(fmt.Sprintf("%s/*.html", httpConfig.Assets.HTML))),
	}

	// asset paths
	e.Static("/assets", httpConfig.Assets.Static)
	e.File("/favicon.ico", httpConfig.Assets.Favicon)

	// create controllers
	appCtrl := &controllers.AppCtrl{}
	controllers := []controllers.Controller{appCtrl}

	// create routers
	indexRouter := &routers.IndexRouter{}
	rters := []routers.Router{indexRouter}

	// create injection graph for automatic dependency injection
	g := inject.Graph{}

	// add various objects to the graph
	if err = g.Provide(
		&inject.Object{Value: e},
		&inject.Object{Value: mongo},
		&inject.Object{Value: appConfig.Dev, Name: "dev"},
		&inject.Object{Value: httpConfig.ReCaptcha.PublicKey, Name: "recaptchaPublicKey"},
		&inject.Object{Value: httpConfig.ReCaptcha.Use, Name: "useRecaptcha"},
	); err != nil {
		panic(err)
	}
	// add controllers to graph
	for _, controller := range controllers {
		if err = g.Provide(&inject.Object{Value: controller}); err != nil {
			panic(err)
		}
	}

	// add routers to graph
	for _, router := range rters {
		if err = g.Provide(&inject.Object{Value: router}); err != nil {
			panic(err)
		}
	}

	// run dependency injection
	if err = g.Populate(); err != nil {
		panic(err)
	}

	// init controllers
	for _, controller := range controllers {
		if err = controller.Init(); err != nil {
			panic(err)
		}
	}
	logger.Info("initialised controllers")

	// init routers
	for _, router := range rters {
		router.Init()
	}
	logger.Info("initialised routers")

	// boot up server
	go e.Start(httpConfig.Address)

	// finish
	delta := (time.Now().UnixNano() - start) / 1000000
	logger.Info("app ready", "startup", delta)
}

func (server *Server) Shutdown(timeout time.Duration) {
	select {
	case <-time.After(timeout):
	}
}

func connectMongoDB(config config.MongoDBConfig) (*mgo.Session, error) {
	var session *mgo.Session
	var err error
	if config.Auth {
		cred := &mgo.Credential{
			Username:  config.Username,
			Password:  config.Password,
			Mechanism: config.Mechanism,
			Source:    config.Source,
		}
		session, err = mgo.Dial(config.Address)
		if err = session.Login(cred); err != nil {
			return nil, err
		}
	} else {
		session, err = mgo.Dial(config.Address)
	}
	if err != nil {
		panic(err)
	}
	session.SetMode(mgo.Monotonic, true)
	session.SetSafe(&mgo.Safe{})
	return session, nil
}
