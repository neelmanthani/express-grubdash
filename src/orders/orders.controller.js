const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function validateFields(req, res, next) {
    const {data: {deliverTo, mobileNumber, dishes} = {}} = req.body;

    if (!deliverTo || deliverTo === "") {
        next({
            status: 400,
            message: `Order must include a deliverTo`
        })
    }

    res.locals.deliverTo = deliverTo;

    if (!mobileNumber || mobileNumber === ""){
        next({
            status: 400,
            message: `Order must include a mobileNumber`
        })
    }

    res.locals.mobileNumber = mobileNumber;

    if (!dishes){
        next({
            status: 400,
            message: `Order must include a dish`
        })
    } else {
        if (!Array.isArray(dishes) || dishes.length == 0) {
            next({
                status: 400,
                message: `Order must include at least one dish`
            })
        }
        dishes.forEach((dish, index) => {
            if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
                next({
                    status: 400,
                    message: `dish ${index} must have a quantity that is an integer greater than 0`
                })
            }
        })
    }

    res.locals.dishes = dishes;

    return next();

}

function validateId(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);

    if (foundOrder) {
        res.locals.order = foundOrder;
        res.locals.orderId = orderId;
        return next();
    } else {
        next({
            status: 404,
            message: `Order does not exist: ${orderId}.`
        })
    }

}

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
    res.json({data: orders});
}

function create (req, res, next) {
    const newOrder = {
        id: nextId(),
        deliverTo: res.locals.deliverTo,
        mobileNumber: res.locals.mobileNumber,
        dishes: res.locals.dishes
    }

    orders.push(newOrder);

    res.status(201).json({data: newOrder});
}

function read(req, res, next) {
    res.json({data: res.locals.order});
}

function update(req, res, next) {
    const id = req.body.data.id
    if (id) {
        if (id != res.locals.orderId) {
            return next({
                status: 400,
                message: `Order id does not match route id. Order: ${id}, Route: ${res.locals.orderId}`
            })
        }
    }

    const {data: {status} = {}} = req.body;

    if (!status || 
        (status !== "pending" 
            && status !== "preparing" 
            && status !== "out-for-delivery" 
            && status !== "delivered"
        )
            ) {
        return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        })
    }


    if (res.locals.order.status && res.locals.order.status === "delivered") {
        return next({
            status: 400,
            message: `A delivered order cannot be changed`
        })
    }

    res.locals.order.deliverTo = res.locals.deliverTo;
    res.locals.order.mobileNumber = res.locals.mobileNumber;
    res.locals.order.dishes = res.locals.dishes;
    res.locals.order.status = status;


    res.json({data: res.locals.order});
}

function destroy(req, res, next) {
    const orderId = req.params.orderId;
    const index = orders.findIndex((order) => order.id === orderId);

    

    if (orders[index].status !== "pending") {
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending.`
        })
    }

    orders.splice(index, 1);

    res.status(204).send();
}

module.exports = {
    list,
    create: [validateFields, create],
    read: [validateId, read],
    update: [validateId, validateFields, update],
    delete: [validateId, destroy]
}